import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
test('Portal V2 mounts Winstnavigator once from canonical shell and existing Foresight',()=>{
 const shell=read('portal-v2/page-shell.js'),src=read('portal-v2/winstnavigator.js');
 assert.match(shell,/mountWinstnavigator\(\{domainState:portalContext\.domainState,stateClient:portalContext\.stateClient\}\)/);
 assert.match(src,/buildForesightStudioModel/);
 assert.match(src,/stateClient\.subscribe/);
 assert.doesNotMatch(src,/fetch\(|localStorage|sessionStorage/);
});
test('unknown business predictions fail closed and scenario labels are explicit',()=>{
 const src=read('portal-v2/winstnavigator.js'),css=read('portal-v2/winstnavigator.css');
 assert.match(src,/Minimaal drie recente meetmomenten/);
 assert.match(src,/geen berekend causaal effect/);
 assert.match(src,/subject!==ui\.subject/);
 assert.match(css,/scroll-snap-type/);
});
