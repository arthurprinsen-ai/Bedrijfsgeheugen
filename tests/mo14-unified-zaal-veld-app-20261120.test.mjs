import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const base='pw-mo14-1/zaalplanner/';
const html=readFileSync(base+'index.html','utf8');
const js=readFileSync(base+'field-unified.js','utf8');
const css=readFileSync(base+'field-unified.css','utf8');
const sw=readFileSync(base+'sw.js','utf8');
const manifest=JSON.parse(readFileSync(base+'manifest.webmanifest','utf8'));
const oldField=readFileSync('pw-mo14-1/veldplanner/index.html','utf8');

const data=(source,label,next)=>{
 const a=source.indexOf('const '+label+'='),b=source.indexOf(';\nconst '+next+'=',a);
 assert.ok(a>=0&&b>a,'missing '+label+' in source');
 return JSON.parse(source.slice(a+('const '+label+'=').length,b));
};
const fieldPlayers=data(js,'PLAYERS','LINEUPS');
const lineups=data(js,'LINEUPS','WINDOWS');
const times=data(js,'WINDOWS','nums');
test('single PWA provides zaal and field as separate views but shared home, tabs and menu',()=>{
 assert.match(html,/const VIEW_IDS=\['home','plan','field','team','stats'/);
 assert.match(html,/data-view-panel="field"/);
 assert.match(html,/id="screen-field"/);
 assert.match(html,/data-sport-choice="zaal"/);
 assert.match(html,/data-sport-choice="field"/);
 assert.match(html,/data-go="field"/);
 assert.match(html,/data-go="plan"/);
 assert.match(html,/class="coach-home-choices"/);
 assert.match(html,/field-unified.js/);
 assert.match(html,/field-unified.css/);
 assert.ok(!html.includes('href="https://pw-mo14-1.netlify.app/veldplanner/"'),'no separate-page field menu');
 assert.equal((html.match(/data-view-panel="field"/g)||[]).length,1);
 assert.equal((html.match(/data-field-block="\d"/g)||[]).length,6);
 for(const a of ['screen-home','screen-plan','screen-field','screen-team','screen-settings','screen-export'])assert.ok(html.includes('id="'+a+'"'));
});
test('field data exactly retained: Jackie keeper, Coco forward, six blocks and two girls benched',()=>{
 assert.deepEqual(fieldPlayers,data(oldField,'PLAYERS','LINEUPS'));
 assert.deepEqual(lineups,data(oldField,'LINEUPS','WINDOWS'));
 assert.deepEqual(times,data(oldField,'WINDOWS','nums'));
 assert.equal(lineups.length,6);
 assert.deepEqual(times,[[0,12],[12,24],[24,35],[35,47],[47,59],[59,70]]);
 for(const lineup of lineups){
  assert.equal(lineup.K,'Jackie');
  assert.equal(Object.keys(lineup).length,11);
  assert.equal(new Set(Object.values(lineup)).size,11);
  assert.ok(['LV','RV',undefined].includes(Object.keys(lineup).find(pos=>lineup[pos]==='Coco-Mijn')));
  assert.notEqual(lineup.LC,'Isis');assert.notEqual(lineup.RC,'Isis');
  assert.equal(Object.keys(fieldPlayers).filter(k=>!Object.values(lineup).includes(k)).length,2);
 }
 assert.equal(lineups[0].LV,'Nine');
});
test('PWA offline manifest and safe style scoping cover both modes',()=>{
 assert.doesNotThrow(()=>new Function(js));
 for(const asset of ['field-unified.js','field-unified.css'])assert.ok(sw.includes("'./"+asset+"'"),asset+' missing from offline cache');
 assert.match(sw,/mo14-unified-coach-v10/);
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.scope,'./');
 assert.ok(manifest.shortcuts.some(s=>s.url==='./#field'));
 assert.ok(manifest.shortcuts.some(s=>s.url==='./#plan'));
 assert.ok(css.includes('#screen-field .field-layout'));
 assert.ok(css.includes('.coach-sport-switch'));
 assert.ok(css.includes('#fieldPrint{display:block!important}'));
 assert.ok(!/eval\s*\(/.test(js));
});
test('field blocks and global mode navigation work without full page reload',()=>{
 const elements=new Map(),events=new Map(),modeClicks=[],store=new Map(),fieldButtons=[],modeButtons=[];
 const cls=()=>({list:new Set(),add(k){this.list.add(k)},remove(k){this.list.delete(k)},toggle(k,p){if(p===undefined)p=!this.list.has(k);p?this.list.add(k):this.list.delete(k);return p;},contains(k){return this.list.has(k)}});
 function el(id=''){if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',classList:cls(),attrs:{},addEventListener(type,fn){events.set(id+':'+type,fn)},setAttribute(k,v){this.attrs[k]=v},toggleAttribute(k,v){this.attrs[k]=v},querySelector(){return null}});return elements.get(id)}
 for(let i=0;i<6;i++)fieldButtons.push({...el('b'+i),dataset:{fieldBlock:String(i)}});
 for(const sport of ['zaal','field'])modeButtons.push({...el('s'+sport),dataset:{sportChoice:sport}});
 const body={classList:cls()};
 const context=vm.createContext({
  document:{body,getElementById:id=>el(id),querySelectorAll:q=>q==='[data-field-block]'?fieldButtons:q==='[data-sport-choice]'?modeButtons:[],querySelector:q=>q==='.matchbar'?el('matchbar'):null},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  showView:(next)=>modeClicks.push(next),activeView:'home',location:{hash:''},
  window:{print:()=>{},PWCoachField:null},Blob,URL,Image:function(){},XMLSerializer:function(){},
  alert:()=>{}
 });
 vm.runInContext(js,context);
 const api=context.window.PWCoachField;
 assert.ok(api);assert.equal(api.getSelectedBlock(),0);
 assert.match(el('fieldCards').innerHTML,/Blok 1/);
 assert.match(el('fieldCards').innerHTML,/Jackie/);
 api.selectBlock(4);
 assert.equal(api.getSelectedBlock(),4);
 assert.equal(store.get('pw_mo14_field_block'),'4');
 assert.match(el('fieldCards').innerHTML,/Blok 5/);
 assert.match(el('fieldBlockStatus').textContent,/Blok 5 van 6/);
 assert.equal(el('fieldPrint').innerHTML.match(/class="print-page/g).length,6);
 context.showView('field',false,false);
 assert.equal(modeClicks.at(-1),'field');
 assert.ok(body.classList.contains('coach-field-active'));
 assert.ok(el('matchbar').classList.contains('coach-hidden'));
 context.showView('home',false,false);
 assert.ok(!body.classList.contains('coach-field-active'));
 assert.ok(!el('matchbar').classList.contains('coach-hidden'));
});
