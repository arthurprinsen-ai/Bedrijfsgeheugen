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
