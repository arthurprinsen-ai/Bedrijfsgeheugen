import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../portal-v2/workspace-shell.js',import.meta.url),'utf8');
const begin=source.indexOf('export function mountWorkspace(');
const end=source.indexOf('\nexport const WORKSPACE_TABS',begin);
assert.ok(begin>=0&&end>begin,'existing production workspace function must be located');
const fn=source.slice(begin,end).replace(/^export /,'');
const flush=async()=>{for(let i=0;i<7;i++)await Promise.resolve()};

function harness({specialist}={}){
 const styles=[];
 const rendered=[];
 const parity=[];
 const fakeDocument={createElement(){
   const shell={
     dataset:{},className:'',innerHTML:'',
     querySelector(selector){return selector==='[data-workspace-content]'?{owner:shell}:null},
     querySelectorAll(){return []}
   };
   return shell;
 }};
 const environment={
   document:fakeDocument,
   workspaceGeneration:new WeakMap(),
   workspaceModel:(contract)=>({id:contract.id,mode:'functional',title:contract.id,
     description:'',saveStatus:'idle',tabs:[{id:'invullen',label:'Invullen'}]}),
   escapeHtml:v=>String(v),saveStatusLabel:()=> 'Gereed',
   loadFunctionalStyles:()=>new Promise(resolve=>styles.push(resolve)),
   mountSpecialist:specialist|| (async(_content,_contract,api,current)=>{
     if(current())rendered.push(api.shell);
     return true;
   }),
   attachLegacyAlgorithmParity:async(_root,_contract,current)=>{
     if(current())parity.push('attached');
   },
   console
 };
 const mount=runInNewContext('('+fn+')',environment);
 const root={dataset:{},replaceChildren(shell){this.firstElementChild=shell}};
 const contract={id:'canvassen',legacyCapability:true};
 return {mount,root,contract,styles,rendered,parity};
}

test('a newer workspace generation never loses its delegate to an older pending styles load',async()=>{
 const h=harness();
 const first=h.mount(h.root,h.contract),second=h.mount(h.root,h.contract);
 assert.ok(first.shell!==second.shell);
 assert.equal(h.styles.length,2,'each generation must obtain its own async opportunity');
 h.styles[0]();await flush();
 assert.equal(h.rendered.length,0,'old generation must not mutate a replaced shell');
 h.styles[1]();await flush();
 assert.equal(h.rendered.length,1);
 assert.equal(h.rendered[0],second.shell);
 assert.equal(second.shell.dataset.functionalWorkspace,'canvassen');
 assert.equal(h.parity.length,1);
});

test('a specialist completing after page navigation cannot attach stale evidence or mutate a new route',async()=>{
 const pending=[];
 const h=harness({specialist:(_content,_contract,api,current)=>
   new Promise(resolve=>pending.push({resolve,shell:api.shell,current}))});
 const previous=h.mount(h.root,h.contract);
 h.styles[0]();await flush();
 assert.equal(pending.length,1);
 const next=h.mount(h.root,h.contract);
 h.styles[1]();await flush();
 assert.equal(pending.length,2);
 pending[0].resolve(true);await flush();
 assert.equal(previous.shell.dataset.functionalWorkspace,undefined);
 assert.equal(h.parity.length,0);
 pending[1].resolve(true);await flush();
 assert.equal(next.shell.dataset.functionalWorkspace,'canvassen');
 assert.equal(h.parity.length,1);
});

test('production specialist waits for lazy import before writing and checks active generation',()=>{
 for(const name of ['roadmap','canvassen','strategiemodellen']){
   assert.match(source,new RegExp('if\\(contract\\.id===.+'+name+'.+if\\(isCurrent\\(\\)\\)module\\.mount'));
 }
 assert.doesNotMatch(source,/root\.dataset\.functionalDelegating/);
 assert.match(source,/const workspaceGeneration=new WeakMap\(\)/);
});
