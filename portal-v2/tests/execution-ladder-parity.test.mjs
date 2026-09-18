import test from 'node:test';
import assert from 'node:assert/strict';
import { nativePageContent } from '../native-pages.js';

test('execution ladder preserves the five fixed legacy steps and planning/value blocks',()=>{
 const state={portal:{execution:{steps:[
  {title:'Tellen finance',status:'Gereed',realizedValue:1200,period:'M1'},
  {title:'Vastleggen finance',status:'Open',period:'M2'}
 ]},roadmap:{items:[]}}};
 const view=nativePageContent('uitvoeringsladder',state);
 assert.ok(view);
 const text=JSON.stringify(view);
 for(const marker of ['Tellen','Vastleggen','Koppelen','Meten','Borgen','vijftien treden over twaalf maanden','Wat het tot nu toe heeft opgeleverd','Wat Bedrijfsgeheugen hierin doet'])assert.match(text,new RegExp(marker,'i'));
 assert.match(text,/€\s?1\.200|€1\.200/);
});

test('execution ladder never invents completed work or realized value in an empty state',()=>{
 const view=nativePageContent('uitvoeringsladder',{portal:{roadmap:{items:[]}}});
 const text=JSON.stringify(view);
 assert.match(text,/Nog niet aangetoond/);
 assert.match(text,/nog geen uitvoeringsstappen/i);
});
