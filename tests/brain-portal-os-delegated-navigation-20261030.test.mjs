import test from 'node:test';
import assert from 'node:assert/strict';
import {mountExecutiveCockpit} from '../portal-v2/operating-system/executive-cockpit.js';

function fixture(){
 const navigationEvents=[];
 let nestedAttached=false;
 const detail={innerHTML:'',scrolled:0,scrollIntoView(){this.scrolled++;}};
 const tab={dataset:{osPage:'evidence-health'},attrs:{},setAttribute(k,v){this.attrs[k]=v;}};
 const nested={dataset:{osPage:'evidence-health'},attrs:{},setAttribute(k,v){this.attrs[k]=v;}};
 const outside={dataset:{osPage:'next-best-actions'},setAttribute(){}};
 const host={
  innerHTML:'',__bgOsPageNavigationBound:false,
  addEventListener(type,handler){navigationEvents.push({type,handler});},
  querySelector(selector){return selector==='.os-module-detail'?detail:null;},
  querySelectorAll(selector){return selector==='[data-os-page]'?(nestedAttached?[tab,nested]:[tab]):[];},
  contains(node){return node===tab||(nestedAttached&&node===nested);}
 };
 const main={querySelector(selector){return selector==='.os-executive-host'?host:null;}};
 const doc={head:null,__bgOsRouteBound:true};
 const root={ownerDocument:doc,querySelector(selector){return selector==='.main'?main:null;}};
 const click=(node)=>navigationEvents[0].handler({target:{closest(selector){assert.equal(selector,'[data-os-page]');return node;}}});
 return {host,root,doc,detail,tab,nested,outside,navigationEvents,click,attachNested(){nestedAttached=true;}};
}

test('click on a dynamically rendered adviser button opens existing evidence page',()=>{
 const f=fixture();
 assert.equal(mountExecutiveCockpit(f.root,{}),true);
 assert.equal(f.navigationEvents.length,1);
 assert.equal(f.navigationEvents[0].type,'click');
 f.attachNested(); // Adviesknop bestaat pas nadat de eerste host-binding is gelegd.
 f.click(f.nested);
 assert.match(f.detail.innerHTML,/Data &amp; Evidence Health/);
 assert.equal(f.tab.attrs['aria-pressed'],'true');
 assert.equal(f.detail.scrolled,1);
});

test('host delegation is single-writer across cockpit refreshes and uses live domain state',()=>{
 const f=fixture();
 const previous=globalThis.__BG_PORTAL_DOMAIN_STATE__;
 let reads=0;
 try{
  globalThis.__BG_PORTAL_DOMAIN_STATE__={get(){reads++;return {powerhouse:{sources:[{name:'CRM',status:'healthy'}]}};}};
  mountExecutiveCockpit(f.root,{});
  mountExecutiveCockpit(f.root,{});
  assert.equal(f.navigationEvents.length,1,'no duplicate listener after refresh');
  f.attachNested();
  f.click(f.nested);
  assert.ok(reads>0,'navigation reads the current canonical domain state');
  assert.match(f.detail.innerHTML,/CRM/);
 }finally{globalThis.__BG_PORTAL_DOMAIN_STATE__=previous;}
});

test('untrusted or removed nodes cannot navigate through the host and unknown pages fail closed',()=>{
 const f=fixture();
 mountExecutiveCockpit(f.root,{});
 f.click(f.outside);
 assert.equal(f.detail.innerHTML,'','outside-host clicks are ignored');
 f.attachNested();
 f.nested.dataset.osPage='not-a-valid-page';
 f.click(f.nested);
 assert.equal(f.detail.innerHTML,'','only canonical pages are rendered');
 f.navigationEvents[0].handler({target:{closest(){return null;}}});
 assert.equal(f.detail.innerHTML,'');
});
