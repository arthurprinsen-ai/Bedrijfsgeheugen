import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const html=readFileSync('afsluiten.html','utf8');
const code=html.match(/<script data-bg-page-runtime="saas-checkout">([\s\S]*?)<\/script>/)?.[1]||'';
const start=code.indexOf("const checkoutForm=document.getElementById('form')");
const end=code.indexOf("if(q.get('success')!=='1')",start);
assert.ok(start>=0&&end>start,'same original checkout readiness helper must exist');
const helper=code.slice(start,end);

function fixture({withForm=true,withSubmit=true,withStatus=false}={}){
 const fields=[{disabled:false},{disabled:false}];
 const entries=new Map();const created=[];
 const form={children:[],attrs:{},querySelectorAll:sel=>sel==='input'?fields:[],appendChild(el){this.children.push(el);entries.set(el.id,el)},setAttribute(k,v){this.attrs[k]=v}};
 const submit={disabled:false};
 if(withForm)entries.set('form',form);
 if(withSubmit)entries.set('submit',submit);
 if(withStatus)entries.set('status',{id:'status',style:{},textContent:'',setAttribute(){}});
 const document={getElementById:id=>entries.get(id)||null,createElement:tag=>{const el={tag,id:'',className:'',style:{},textContent:'',attrs:{},setAttribute(k,v){this.attrs[k]=v;if(k==='id')this.id=v}};created.push(el);return el}};
 const context={document,t:s=>s};
 vm.runInNewContext('let checkoutReady=false;\n'+helper,context);
 const run=expr=>vm.runInNewContext(expr,context);
 return {form,submit,entries,created,fields,run};
}

test('missing cosmetic status is restored idempotently and current checkout stays disabled until provider readiness',()=>{
 const f=fixture();
 assert.equal(f.run("setCheckoutReady(false);setCheckoutReady(false);checkoutReady"),false);
 assert.equal(f.created.length,1);
 const status=f.entries.get('status');
 assert.equal(status.className,'status');
 assert.equal(status.attrs.role,'status');
 assert.equal(status.attrs['aria-live'],'polite');
 assert.equal(f.form.attrs['data-bg-checkout-status-recovered'],'true');
 assert.equal(status.style.display,'block');
 assert.match(status.textContent,/Online betalen is op dit moment niet beschikbaar/);
 assert.equal(f.submit.disabled,true);
 assert.ok(f.fields.every(x=>x.disabled===true));
});

test('missing real payment form or submit is not invented and readiness stays false',()=>{
 for(const options of [{withForm:false},{withSubmit:false}]){
  const f=fixture(options);
  assert.equal(f.run("setCheckoutReady(true);checkoutReady"),false);
  assert.equal(f.created.length,0);
  assert.equal(f.entries.has('status'),false);
 }
});

test('existing status is preserved and original provider-specific readiness + payment protections remain',()=>{
 const f=fixture({withStatus:true});
 assert.equal(f.run("setCheckoutReady(false);checkoutReady"),false);
 assert.equal(f.created.length,0);
 assert.equal(f.submit.disabled,true);
 assert.equal(f.run("setCheckoutReady(true);checkoutReady"),true);
 assert.equal(f.submit.disabled,false);
 assert.equal(f.entries.get('status').style.display,'none');
 assert.match(code,/data\?\.selfServeAvailable===true/);
 assert.match(code,/\/api\/checkout\/readiness/);
 assert.match(code,/\/api\/checkout\/create/);
 assert.match(code,/bg_checkout_attempt_v1/);
 assert.match(html,/id="status" class="status" role="status" aria-live="polite"/);
 const pageCheck=readFileSync('.github/scripts/paginacontrole.py','utf8');
 assert.match(pageCheck,/pagina\.on\('pageerror'/);
});
