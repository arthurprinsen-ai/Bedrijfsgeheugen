import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const get=x=>readFileSync(join(root,x),'utf8');
const html=get('index.html'),js=get('insight-lens.js'),css=get('insight-lens.css');
test('one canonical interaction layer for all page visual types',()=>{
 assert.match(html,/insight-lens\.css/);assert.match(html,/insight-lens\.js/);
 for(const selector of ['figure.v2visual','.pfs-chart','[data-chart]','.pvtablewrap','#portalView table','[data-canvas]','.roadmap-board'])
  assert.ok(js.includes(selector),selector);
 assert.match(js,/MutationObserver/);
});
test('no client-side fake forecasts or hidden persistence',()=>{
 assert.doesNotMatch(js,/localStorage|sessionStorage|Math\.random|fetch\(/);
 assert.match(js,/Bron niet gespecificeerd/);
 assert.match(js,/Een scenario is een aanname/);
 assert.match(js,/data-evidence-ref/);
});
test('touch and accessible keyboard parity',()=>{
 assert.match(js,/aria-modal/);assert.match(js,/e\.key==='Escape'/);assert.match(js,/e\.key==='Tab'/);
 assert.match(css,/min-height:44px/);assert.match(css,/prefers-reduced-motion/);
});
