import test from 'node:test';
import assert from 'node:assert/strict';
import {bindPortalNavigation, currentPortalRoute} from '../router.js';

test('newly rebuilt sidebar buttons still dispatch through the canonical portal router', () => {
 const keys=['document','location','history','addEventListener'];
 const saved=Object.fromEntries(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const listeners=[];
 const pushed=[];
 const nav={
   addEventListener(type,fn){listeners.push({type,fn});},
   contains(button){return button===freshButton;}
 };
 const freshButton={dataset:{navTarget:'csrd-impact'}};
 try {
   Object.defineProperty(globalThis,'document',{configurable:true,value:{
     querySelector(selector){return selector==='.sidebar .nav'?nav:null;},
     querySelectorAll(){return [];}
   }});
   Object.defineProperty(globalThis,'location',{configurable:true,value:{
     href:'https://www.bedrijfsgeheugen.nl/portal-v2/',
     pathname:'/portal-v2/',
     search:''
   }});
   Object.defineProperty(globalThis,'history',{configurable:true,value:{
     replaceState(){},
     pushState(state,title,url){pushed.push({state,title,url});}
   }});
   Object.defineProperty(globalThis,'addEventListener',{configurable:true,value(){}});
   const pages=[];
   bindPortalNavigation({openPage:pageId=>{pages.push(pageId);return true;},showOverview:()=>{}});
   assert.equal(listeners.filter(item=>item.type==='click').length,1);
   // The button is created after router binding, matching an authenticated
   // portal-state refresh which rebuilds the sidebar with innerHTML.
   listeners.find(item=>item.type==='click').fn({
     target:{closest(selector){assert.equal(selector,'[data-nav-target]');return freshButton;}}
   });
   assert.deepEqual(pages,['csrd-impact']);
   assert.equal(currentPortalRoute().target,'csrd-impact');
   assert.ok(pushed[0].url.endsWith('?page=csrd-impact'));
 } finally {
   for(const key of keys){
     if(saved[key])Object.defineProperty(globalThis,key,saved[key]);
     else delete globalThis[key];
   }
 }
});
