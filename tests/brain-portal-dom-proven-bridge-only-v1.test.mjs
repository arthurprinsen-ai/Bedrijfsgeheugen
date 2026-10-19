import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../.github/workflows/portal-v2-production-dom-readback.yml',import.meta.url),'utf8');
const line=source.split('\n').find(s=>s.includes('supabase/functions/netlify-deploy-bridge/index.ts|brain/skills/powerhouse-portal-dom-bridge-only-override-v1.json|platform/system-map/canonical-system-map.mjs) ;;'));
const allowed=line?.trim().replace(/^case\s+\S+\s+in\s*/,'').replace(/\)\s*;;\s*$/,'').split('|')||[];
const singleFileAllowed=file=>allowed.some(pattern=>
 pattern.endsWith('/*')?file.startsWith(pattern.slice(0,-1)):file===pattern
);

test('exact deployment bridge (not all Supabase runtime) is allowable after published portal SHA',()=>{
 assert.ok(line,'scope whitelist must have exact bridge path');
 assert.equal(singleFileAllowed('supabase/functions/netlify-deploy-bridge/index.ts'),true);
 assert.equal(singleFileAllowed('brain/skills/powerhouse-portal-dom-bridge-only-override-v1.json'),true);
 assert.equal(singleFileAllowed('platform/system-map/canonical-system-map.mjs'),true);
 for(const other of [
  'supabase/functions/portal-state-eu/index.ts',
  'brain/skills/other-agent-runtime.json',
  'supabase/functions/netlify-deploy-bridge/other.ts',
  'portal-v2/decision-twin-receipt.js',
  'portal-v2/foresight-scenario-studio.js',
  'netlify/functions/portal-api.mjs',
  'website/index.html'
 ])assert.equal(singleFileAllowed(other),false,other+' must require exact newer publish');
 assert.ok(!source.includes('supabase/functions/*) ;;'),'blanket Edge-function bypass forbidden');
});
test('immutable published main and approved merged PR remain mandatory',()=>{
 assert.match(source,/git merge-base --is-ancestor "\$PORTAL_EXPECTED_SHA" "\$GITHUB_SHA"/);
 assert.match(source,/Production SHA override requires main workflow_dispatch with valid commit SHA/);
 assert.match(source,/Source PR merge is not in the verified published production ancestry/);
 assert.match(source,/Exact immutable Netlify deploy did not become ready/);
 assert.match(source,/Read back Portal V2 DOM, standalone routing and CSRD assets/);
 assert.match(source,/npx playwright test tests\/integration\/portal-v2-production-/);
 assert.match(source,/PLAYWRIGHT_PACKAGE=@playwright\/test@1\.61\.0/);
});
