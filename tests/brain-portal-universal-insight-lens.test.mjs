import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const js=read('portal-v2/insight-lens.js');
const html=read('portal-v2/index.html');
test('contextual insight explorer is in the one canonical portal',()=>{
 assert.match(html,/insight-lens\.js/);
 assert.match(html,/insight-lens\.css/);
 assert.match(js,/import \{navigatePortal\} from '\.\/router\.js'/);
 for(const type of ['figure.v2visual','.pfs-chart','.pvtablewrap','#portalView table','[data-canvas]','.roadmap-board'])
  assert.ok(js.includes(type),type);
});
test('unknown evidence and scenario hypotheses are never represented as verified',()=>{
 assert.match(js,/Bron niet gespecificeerd bij deze visualisatie/);
 assert.match(js,/Een scenario is een aanname/);
 assert.match(js,/data-evidence-ref/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(/);
});
test('dynamic visuals, keyboard and mobile interactions stay supported',()=>{
 assert.match(js,/MutationObserver/);
 assert.match(js,/bg:portal-identity-boundary/);
 const app=read('portal-v2/app.js');
 assert.match(app,/portalVisualAuthSubject/);
 assert.match(app,/new Event\('bg:portal-identity-boundary'\)/);
 assert.match(js,/e\.key==='Escape'/);
 assert.match(js,/e\.key==='Tab'/);
 assert.match(read('portal-v2/insight-lens.css'),/min-height:44px/);
});
