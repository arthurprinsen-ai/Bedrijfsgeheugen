import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createScanClaimBridge} from '../portal-v2/scan-claim-bridge.js';

class FakeNode {
 constructor(tag='div'){this.tagName=tag;this.style={};this.hidden=false;this.disabled=false;this.textContent='';this.listeners={};this.children=[];}
 setAttribute(key,value){this[key]=value;}
 append(...children){this.children.push(...children);}
 appendChild(child){this.children.push(child);return child;}
 replaceChildren(...children){this.children=children;}
 before(child){this.beforeChild=child;}
 addEventListener(event,callback){this.listeners[event]=callback;}
}
function setup(postResponse){
 const main=new FakeNode('main'),nodes=[];
 const doc={
  querySelector:selector=>selector==='.main .executive-glance'||selector==='.main'?main:null,
  createElement:tag=>{const node=new FakeNode(tag);nodes.push(node);return node;}
 };
 const session={getItem:key=>key==='bg_last_scan_ref'?'bedrijfslek-123456789abc':null,removeItem(){}};
 const storage={getItem:()=>null,removeItem(){}};
 const requests=[];let refreshed=0;
 const fetcher=async(path,init)=>{
  requests.push({path,method:init.method||'GET'});
  if(init.method==='POST')return {ok:true,status:200,json:async()=>postResponse};
  return {ok:true,status:200,json:async()=>({ok:true,scans:[{tenant_identity_status:'verified',score:52,soort:'bedrijfslek'}]})};
 };
 const bridge=createScanClaimBridge({
  doc,session,storage,fetcher,
  authHeaders:async()=>({authorization:'Bearer test.token'}),
  onClaimed:async()=>{refreshed++;}
 });
 bridge.setAuthenticated(true,'tenant-one');
 const claim=nodes.find(node=>node.tagName==='button'&&node.textContent.includes('Koppel mijn gratis Bedrijfslek'));
 return {claim,requests,refreshed:()=>refreshed};
}

test('verified tenant scan claim immediately revalidates canonical portal truth exactly once',async()=>{
 const claim=setup({ok:true,claimed:true,scan:{tenant_identity_status:'verified'}});
 await claim.claim.listeners.click();
 assert.equal(claim.refreshed(),1);
 assert.equal(claim.requests.filter(x=>x.method==='POST').length,1);
 assert.ok(claim.requests.some(x=>x.method==='GET'));
});
test('failed or unverified scan receipt never revalidates Brain as if claimed',async()=>{
 for(const response of [{ok:true,claimed:false,scan:{tenant_identity_status:'verified'}},{ok:true,claimed:true,scan:{tenant_identity_status:'unverified'}}]){
  const context=setup(response);
  await context.claim.listeners.click();
  assert.equal(context.refreshed(),0);
 }
});
test('scan claim only triggers the existing authenticated Portal V2 revalidation, not duplicate storage or a new scheduler',()=>{
 const code=readFileSync(new URL('../portal-v2/app.js',import.meta.url),'utf8');
 const bridge=readFileSync(new URL('../portal-v2/scan-claim-bridge.js',import.meta.url),'utf8');
 assert.match(code,/onClaimed:\(\)=>portalDomainState\.refresh\(\)/);
 assert.match(bridge,/current===revision&&authenticated/);
 assert.match(bridge,/data\?\.scan\?\.tenant_identity_status!=='verified'/);
 assert.doesNotMatch(bridge,/cron\.schedule|localStorage\.setItem/);
});
