import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPortalStateFromLegacy,createEmptyPortalState,readLegacyBrowserState} from '../portal/legacy-state.mjs';

test('maps existing portal state into canonical live portal state without invented value',()=>{
 const state=buildPortalStateFromLegacy({legacyState:{niveaus:{sturing:4,mensen:3,operatie:2,quality:3,tech:4,analytics:2},taken:[{id:'a1',titel:'Proces vastleggen',eigenaar:'Sanne',deadline:'2 sep'}],besluiten:[{id:'d1',titel:'CRM behouden',eigenaar:'MT'}],docs:[{naam:'Proceshandboek'}]},user:{email:'x@example.nl'},lead:{bedrijf:'Acme'},now:0});
 assert.equal(state.company.name,'Acme');assert.equal(state.sourceMeta.live,true);assert.equal(state.actions[0].title,'Proces vastleggen');assert.equal(state.decisions[0].title,'CRM behouden');assert.equal(state.monthlyImpact.length,0);assert.equal(state.valueItems.length,0);assert.deepEqual(state.signals,[]);
});

test('only reads private legacy state for authenticated email key',()=>{const map=new Map([['bg_portaal_other@example.nl',JSON.stringify({taken:[{titel:'GEHEIM'}]})],['bg_portaal_me@example.nl',JSON.stringify({taken:[{titel:'Mijn actie'}]})]]);const storage={getItem:k=>map.get(k)||null};const s=readLegacyBrowserState({storage,user:{email:'me@example.nl'},now:0});assert.equal(s.actions[0].title,'Mijn actie');assert.equal(s.actions.some(x=>x.title==='GEHEIM'),false)});

test('anonymous browser can use scan package but cannot read another email state',()=>{const map=new Map([['bg_portaal_other@example.nl',JSON.stringify({taken:[{titel:'GEHEIM'}]})],['bg_scan_pakket',JSON.stringify({score:64,datum:'2026-08-29'})]]);const storage={getItem:k=>map.get(k)||null};const s=readLegacyBrowserState({storage,user:null,now:0});assert.equal(s.company.health,64);assert.equal(s.actions.length,0)});

test('empty runtime state contains no demo KPIs',()=>{const s=createEmptyPortalState({now:0});assert.equal(s.sourceMeta.kind,'empty');assert.equal(s.company.health,null);assert.deepEqual(s.healthCards,[]);assert.deepEqual(s.recommendedActions,[])});
