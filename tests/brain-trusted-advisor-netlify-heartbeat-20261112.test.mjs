import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {NETLIFY_RUNTIME_EXACT, deriveNetlifyDeploymentApplicability} from '../tools/delivery/netlify-deployment-applicability.mjs';

test('original Netlify production heartbeat is bounded and does not override build config',()=>{
  const config=readFileSync('netlify.toml','utf8');
  const marker='# trusted-advisor canonical brand-shell readback production heartbeat: 20261112-v1';
  assert.equal(config.split(marker).length-1,1,'heartbeat must be unique and comment only');
  assert.match(config,/^\s*ignore\s*=\s*"node \.\/tools\/ci\/netlify-ignore-build\.mjs"\s*$/m);
  assert.match(config,/^\s*command\s*=\s*"node tools\/ci\/netlify-build-entry\.mjs"\s*$/m);
  assert.ok(NETLIFY_RUNTIME_EXACT.has('netlify.toml'),'original Netlify deployment authority must classify config changes as runtime');
});

test('production readiness requires an original build for heartbeat, not for source-only verifier changes',()=>{
  const policy=JSON.parse(readFileSync('config/brain-delivery-system.json','utf8'));
  const headSha='a'.repeat(40);
  const heartbeat=deriveNetlifyDeploymentApplicability({changedPaths:['netlify.toml'],headSha,policy});
  assert.equal(heartbeat.deploymentRequired,true);
  assert.equal(heartbeat.netlifyRuntimeRequired,true);
  const sourceOnly=deriveNetlifyDeploymentApplicability({changedPaths:['tools/site-shell/live-contract.mjs','tests/brain-trusted-advisor-production-shell-oracle-20261112.test.mjs'],headSha,policy});
  assert.equal(sourceOnly.deploymentRequired,false);
});

test('original live verifier and corrected site-shell source keep current evidence-safe claims',()=>{
  const verifier=readFileSync('tools/site-shell/live-contract.mjs','utf8');
  const source=readFileSync('tools/site-shell/components.mjs','utf8');
  for(const claim of ['Duidelijke afspraken vooraf','Klein beginnen, resultaat toetsen']){
    assert.ok(verifier.includes(claim));
    assert.ok(source.includes(claim));
  }
  assert.doesNotMatch(verifier,/Vaste prijs, geen uurtje-factuurtje|In twee weken draaiend/);
});
