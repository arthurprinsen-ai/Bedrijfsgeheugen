import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {generateKeyPairSync} from 'node:crypto';
test('tenant connection preflight fails closed and never prints credentials',()=>{
 const env={...process.env};
 for(const key of ['TENANT_CONTRACT_VERIFY_ENDPOINT','TENANT_CONTRACT_VERIFY_ALLOWED_ORIGIN',
 'TENANT_CONTRACT_VERIFY_TOKEN','TENANT_LIVE_READBACK_ENDPOINT',
 'TENANT_LIVE_READBACK_ALLOWED_ORIGIN','TENANT_LIVE_READBACK_TOKEN',
 'TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM'])delete env[key];
 const r=spawnSync(process.execPath,['tests/ai-model-tenant-connection-readiness.mjs'],{encoding:'utf8',env});
 assert.equal(r.status,2);
 const status=JSON.parse(r.stdout);
 assert.equal(status.status,'BLOCKED');
 assert.equal(status.connections.length,3);
 assert.ok(status.connections.every(c=>c.status==='NOT_CONFIGURED'));
});
test('configured values remain unverified without actual contract/provider reads',()=>{
 const env={...process.env,
 TENANT_CONTRACT_VERIFY_ENDPOINT:'https://vault.example/verify',
 TENANT_CONTRACT_VERIFY_ALLOWED_ORIGIN:'https://vault.example',
 TENANT_CONTRACT_VERIFY_TOKEN:'private-vault-token-should-never-print',
 TENANT_LIVE_READBACK_ENDPOINT:'https://gateway.example/readback',
 TENANT_LIVE_READBACK_ALLOWED_ORIGIN:'https://gateway.example',
 TENANT_LIVE_READBACK_TOKEN:'private-gateway-token-should-never-print',
 TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM:generateKeyPairSync('ed25519').publicKey.export({type:'spki',format:'pem'})};
 const r=spawnSync(process.execPath,['tests/ai-model-tenant-connection-readiness.mjs'],{encoding:'utf8',env});
 assert.equal(r.status,2);
 assert.equal(JSON.parse(r.stdout).status,'CONFIGURED_NOT_VERIFIED');
 assert.doesNotMatch(r.stdout,/private-(vault|gateway)-token/);
});

test('placeholder public key fails closed before authenticated reads',()=>{
 const env={...process.env,
 TENANT_CONTRACT_VERIFY_ENDPOINT:'https://vault.example/verify',
 TENANT_CONTRACT_VERIFY_ALLOWED_ORIGIN:'https://vault.example',
 TENANT_CONTRACT_VERIFY_TOKEN:'hidden',
 TENANT_LIVE_READBACK_ENDPOINT:'https://gateway.example/readback',
 TENANT_LIVE_READBACK_ALLOWED_ORIGIN:'https://gateway.example',
 TENANT_LIVE_READBACK_TOKEN:'hidden',
 TENANT_ATTESTATION_VERIFY_PUBLIC_KEY_PEM:'public-key-placeholder'};
 const r=spawnSync(process.execPath,['tests/ai-model-tenant-connection-readiness.mjs'],{encoding:'utf8',env});
 assert.equal(r.status,2);
 const status=JSON.parse(r.stdout);
 assert.equal(status.status,'BLOCKED');
 assert.ok(status.connections.some(c=>c.integration==='attestation'&&c.status==='INVALID_PUBLIC_VERIFY_KEY'));
});

test('Bedrock preflight does not accept untrusted region values',()=>{
 const env={...process.env,POWERHOUSE_BEDROCK_TARGET_REGIONS:'invalid-region'};
 const r=spawnSync(process.execPath,['tests/ai-model-tenant-connection-readiness.mjs'],{encoding:'utf8',env});
 assert.equal(r.status,2);
 const outcome=JSON.parse(r.stdout);
 assert.equal(outcome.status,'BLOCKED');
 assert.equal(outcome.connections.find(x=>x.integration==='aws_bedrock_nova_premier').status,'INVALID_REGION_CONFIGURATION');
});

test('Bedrock readback with no AWS identity stays blocked',()=>{
 const env={...process.env,POWERHOUSE_BEDROCK_TARGET_REGIONS:'us-east-1',
  AWS_PROFILE:'nonexistent-powerhouse-readback-test-profile',
  AWS_SHARED_CREDENTIALS_FILE:'/dev/null',AWS_CONFIG_FILE:'/dev/null'};
 const r=spawnSync(process.execPath,['tests/ai-model-tenant-connection-readiness.mjs'],{encoding:'utf8',env,timeout:25000});
 assert.equal(r.status,2);
 const outcome=JSON.parse(r.stdout);
 assert.equal(outcome.status,'BLOCKED');
 const aws=outcome.connections.find(x=>x.integration==='aws_bedrock_nova_premier');
 assert.equal(aws.status,'AWS_IDENTITY_NOT_AUTHENTICATED');
 assert.equal(aws.account_identity_checked,undefined);
});
