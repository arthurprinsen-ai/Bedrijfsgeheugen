import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { verifyGitHubOidcToken } from '../netlify/functions/powerhouse-control-plane-evidence.mjs';

function enc(value){return Buffer.from(JSON.stringify(value)).toString('base64url');}

test('control-plane OIDC accepts only exact repository/workflow/audience lineage', async()=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk=publicKey.export({format:'jwk'});
  jwk.kid='test-kid'; jwk.alg='RS256'; jwk.use='sig';
  const now=Math.floor(Date.now()/1000);
  const header={alg:'RS256',kid:'test-kid',typ:'JWT'};
  const payload={
    iss:'https://token.actions.githubusercontent.com',
    aud:'powerhouse-control-plane-v1',
    repository:'arthurprinsen-ai/Bedrijfsgeheugen',
    workflow_ref:'arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/obligation-terminal-closure.yml@refs/heads/main',
    actor:'arthurprinsen-ai',
    exp:now+300,
    nbf:now-5,
  };
  const unsigned=`${enc(header)}.${enc(payload)}`;
  const signature=sign('RSA-SHA256',Buffer.from(unsigned),privateKey).toString('base64url');
  const token=`${unsigned}.${signature}`;
  const claims=await verifyGitHubOidcToken(token,{now,fetchImpl:async()=>new Response(JSON.stringify({keys:[jwk]}),{status:200})});
  assert.equal(claims.repository,'arthurprinsen-ai/Bedrijfsgeheugen');
});

test('control-plane OIDC rejects a token from another workflow', async()=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const jwk=publicKey.export({format:'jwk'});
  jwk.kid='test-kid'; jwk.alg='RS256'; jwk.use='sig';
  const now=Math.floor(Date.now()/1000);
  const header={alg:'RS256',kid:'test-kid',typ:'JWT'};
  const payload={
    iss:'https://token.actions.githubusercontent.com',
    aud:'powerhouse-control-plane-v1',
    repository:'arthurprinsen-ai/Bedrijfsgeheugen',
    workflow_ref:'arthurprinsen-ai/Bedrijfsgeheugen/.github/workflows/other.yml@refs/heads/main',
    exp:now+300,
  };
  const unsigned=`${enc(header)}.${enc(payload)}`;
  const signature=sign('RSA-SHA256',Buffer.from(unsigned),privateKey).toString('base64url');
  await assert.rejects(
    ()=>verifyGitHubOidcToken(`${unsigned}.${signature}`,{now,fetchImpl:async()=>new Response(JSON.stringify({keys:[jwk]}),{status:200})}),
    /OIDC_WORKFLOW_REJECTED/,
  );
});
