import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const yaml=readFileSync(new URL('../.github/workflows/powerhouse-delivery-recovery-supervisor.yml',import.meta.url),'utf8');
const probe=yaml.split('\n  release-app-identity-proof:')[1];
test('identity probe is manual, mutually exclusive and pinned to protected main',()=>{
 assert.ok(probe);
 assert.match(probe,/github.event_name == 'workflow_dispatch' && inputs.release_app_identity == true && inputs.patch_handoff != true && github.ref == 'refs\/heads\/main'/);
 assert.match(probe,/environment: powerhouse-release-controller/);
 assert.match(probe,/permissions:\s*\n\s*contents: read/);
 assert.match(probe,/persist-credentials: false/);
 assert.ok(probe.includes('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"'));
 assert.match(yaml,/inputs.patch_handoff != true && inputs.release_app_identity != true/);
 assert.match(yaml,/inputs.patch_handoff == true && inputs.release_app_identity != true/);
 assert.match(yaml,/cron: '2-57\/5 \* \* \* \*'/);
});
test('probe exposes identity only and cannot authorize mutation',()=>{
 assert.match(probe,/verifyReleaseApp/);
 assert.match(probe,/exclusiveWriterVerified:false,mutationAuthority:false/);
 assert.doesNotMatch(probe,/gh api|gh pr|git push|contents: write|actions: write|pull-requests: write|statuses: write/);
 assert.match(probe,/APP_PROBE_FAILED/);
 assert.doesNotMatch(probe,/console\.error\(e\)/);
});

test('scoped token proof is opt-in within identity job only; normal writer and scheduler not invoked by token-only dispatch',()=>{
 assert.match(yaml,/release_app_token:\s*\n\s*description:[^\n]+\n\s*type: boolean\n\s*required: false\n\s*default: false/);
 assert.match(yaml,/inputs.patch_handoff != true && inputs.release_app_identity != true && inputs.release_app_token != true/);
 assert.match(yaml,/inputs.patch_handoff == true && inputs.release_app_identity != true && inputs.release_app_token != true/);
 assert.match(probe,/RELEASE_APP_TOKEN_PROOF: \$\{\{ inputs.release_app_token \}\}/);
 assert.match(probe,/if\(process.env.RELEASE_APP_TOKEN_PROOF==='true'\)/);
 assert.match(probe,/proveScopedPromotionToken/);
 assert.match(probe,/scopeVerified:true,revocationVerified:true,exclusiveWriterVerified:false,mutationAuthority:false/);
 assert.doesNotMatch(probe,/console\.log\(tokenProof\)|console\.error\(e\)/);
});

import {scanText} from '../tools/ci/egress-guard.mjs';
const path='.github/workflows/powerhouse-delivery-recovery-supervisor.yml';
test('read-only fence mode is manual, opt-in, isolated from promotion and existing scheduler',()=>{
 assert.match(yaml,/release_app_fence:\s*\n\s*description:[^\n]+\n\s*type: boolean\n\s*required: false\n\s*default: false/);
 assert.match(yaml,/inputs.patch_handoff != true && inputs.release_app_identity != true && inputs.release_app_token != true && inputs.release_app_fence != true/);
 assert.match(yaml,/inputs.patch_handoff == true && inputs.release_app_identity != true && inputs.release_app_token != true && inputs.release_app_fence != true/);
 assert.match(probe,/inputs.release_app_fence != true \|\| inputs.release_app_token != true/);
 assert.match(probe,/expectedMainSha:process.env.GITHUB_SHA/);
 assert.match(probe,/fenceState:complete\?f.fenceState:'NATIVE_INVENTORY_UNPROVEN'/);
 assert.match(probe,/if\(!complete\) throw Error\('FENCE_READ_NATIVE_INVENTORY_UNPROVEN'\)/);
 assert.doesNotMatch(probe,/console\.log\(f\)|console\.error\(e\)/);
});
test('exact secret exception permits only the reviewed job bytes',()=>{
 assert.deepEqual(scanText(path,yaml,true),[]);
 const marker='\n  release-app-identity-proof:';
 const start=yaml.indexOf(marker);
 const prefix=yaml.slice(0,start),suffix=yaml.slice(start);
 const denied=(a,b)=>{assert.ok(suffix.includes(a));const changed=prefix+suffix.replace(a,b);assert.notEqual(changed,yaml);assert.ok(scanText(path,changed,true).some(v=>v.rule==='SECRET_NOT_ALLOWLISTED'));};
 denied('contents: read','contents: write');
 denied('persist-credentials: false','persist-credentials: true');
 denied('if(!complete) throw Error','if(complete) throw Error');
 denied('    environment: powerhouse-release-controller','    environment: other');
 denied('          RELEASE_APP_FENCE_PROOF:','          EXPOSE: ${{ secrets.POWERHOUSE_RELEASE_APP_PRIVATE_KEY }}\n          RELEASE_APP_FENCE_PROOF:');
 assert.ok(scanText('other.yml',yaml,true).some(v=>v.rule==='SECRET_NOT_ALLOWLISTED'));
});
