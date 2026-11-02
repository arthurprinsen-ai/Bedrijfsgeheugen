import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {radar,gantt,curve,benchmarkBars,leakage} from '../visuals.js';
import {fieldMarkup} from '../form-primitives.js';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>readFileSync(join(root,name),'utf8');

test('design identity is additive to canonical portal, not a second app',()=>{
 const html=read('index.html'),css=read('living-interface.css'),js=read('living-interface.js');
 assert.match(html,/living-interface\.css/);
 assert.match(html,/living-interface\.js/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/focus-visible/);
 assert.match(css,/max-width:480px/);
 assert.match(js,/ArrowRight/);
 assert.match(js,/ArrowLeft/);
 assert.match(js,/Home/);
 assert.match(js,/End/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|\.post\(|\.put\(|Math\.random/);
 assert.match(html,/insight-lens\.js/);
});
test('five canonical chart families expose same actual values as accessible tables',()=>{
 const outputs=[
  radar([{label:'Operatie',value:2.5},{label:'Verkoop',value:4},{label:'Mensen',value:3}]),
  gantt([{title:'Actie',start:2,duration:3,progress:25}]),
  curve([{label:'Januari',value:1234.55},{label:'Februari',value:1350}],{valueLabel:'euro'}),
  benchmarkBars([{label:'Marge',value:12.4,benchmark:11.2}]),
  leakage([{label:'Dubbele invoer',value:42},{label:'Wachttijd',value:11}])
 ];
 for(const html of outputs){
  assert.match(html,/<details class="bg-li-dataset">/);
  assert.match(html,/<table><caption>/);
  assert.match(html,/<th scope="row">/);
  assert.match(html,/zelfde waarden als de grafiek/);
 }
 assert.match(outputs[2],/1\.234,55/);
 assert.match(outputs[3],/12,4/);
});
test('chart table text is escaped, missing metrics never fabricated as 0',()=>{
 const html=benchmarkBars([{label:'<script>alert(1)</script>',value:null,benchmark:undefined}]);
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/Niet beschikbaar/);
 assert.equal(curve([],{}),'');
});
test('shared field primitive connects instructions, required state and error to native input',()=>{
 const markup=fieldMarkup({id:'omzet',label:'Omzet',type:'currency',required:true,help:'Voer de echte omzet in.'},'');
 assert.match(markup,/required aria-required="true"/);
 assert.match(markup,/aria-describedby="omzet-error omzet-help"/);
 assert.match(markup,/id="omzet-help"/);
 assert.match(markup,/id="omzet-error"/);
 assert.match(read('form-primitives.js'),/node\.checkValidity\(\)/);
 assert.match(read('form-primitives.js'),/if\(!valid\).*return/);
});
