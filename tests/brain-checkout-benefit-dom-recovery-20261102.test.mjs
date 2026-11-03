import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const html=readFileSync('afsluiten.html','utf8');
const code=html.match(/<script data-bg-page-runtime="saas-checkout">([\s\S]*?)<\/script>/)?.[1]||'';
const start=code.indexOf('function setCheckoutBenefit(id,text)');
const end=code.indexOf('function setTrialLink(text,href)',start);
assert.ok(start>=0&&end>start,'original checkout helper must be present');
const helper=code.slice(start,end);

function fixture(withCard=true){
 const items=new Map();
 const list={children:[],attrs:{},appendChild(node){this.children.push(node);items.set(node.id,node)},setAttribute(k,v){this.attrs[k]=v}};
 const card={children:[],appendChild(node){this.children.push(node)},querySelector(q){return q==='ul'?list:null}};
 const doc={getElementById:id=>items.get(id)||null,querySelector:s=>s==='.card.plan ul'&&withCard?list:s==='.card.plan'&&withCard?card:null,createElement:tag=>({tag,children:[],appendChild(node){this.children.push(node);items.set(node.id,node)},setAttribute(k,v){this[k]=v}})};
 const run=code=>vm.runInNewContext(helper+code,{document:doc,t:s=>s});
 return {items,list,card,run};
}

test('missing cosmetic checkout benefit is restored as real plan-list DOM, not silently skipped',()=>{
 const f=fixture();
 f.run(";setCheckoutBenefit('sources','Tot 2 integraties');setCheckoutBenefit('freshness','Dagelijks');setCheckoutBenefit('automation','Advies')");
 assert.deepEqual(f.list.children.map(x=>x.id),['sources','freshness','automation']);
 assert.equal(f.items.get('sources').textContent,'Tot 2 integraties');
 assert.equal(f.list.attrs['data-bg-checkout-recovered'],'true');
 f.run(";setCheckoutBenefit('sources','Tot 10 integraties')");
 assert.equal(f.list.children.length,3,'same benefit is never duplicated');
 assert.equal(f.items.get('sources').textContent,'Tot 10 integraties');
});

test('missing plan container and unknown benefit IDs remain failures, never fake checkout green',()=>{
 assert.throws(()=>fixture(false).run(";setCheckoutBenefit('sources','test')"),/CHECKOUT_PLAN_CARD_MISSING/);
 assert.throws(()=>fixture().run(";setCheckoutBenefit('paymentTerms','overwrite')"),/CHECKOUT_BENEFIT_ID_INVALID/);
});

test('the original payment readiness, provider completion, and page-error CI gate stay intact',()=>{
 assert.match(html,/checkoutReady=false/);
 assert.match(html,/data\?\.selfServeAvailable===true/);
 assert.match(html,/\/api\/checkout\/readiness\?session_id=/);
 assert.match(html,/\/api\/checkout\/create/);
 assert.match(html,/bg_checkout_attempt_v1/);
 const pageCheck=readFileSync('.github/scripts/paginacontrole.py','utf8');
 assert.match(pageCheck,/pagina\.on\('pageerror'/);
 assert.match(code,/setCheckoutBenefit\('sources',p\.sources\)/);
 assert.match(code,/setCheckoutBenefit\('freshness',p\.freshness\)/);
 assert.match(code,/setCheckoutBenefit\('automation',p\.automation\)/);
});
