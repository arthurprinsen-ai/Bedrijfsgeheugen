import test from 'node:test';
import assert from 'node:assert/strict';
import {portalAuthoringReadbackMatches,createPortalStateClient} from '../portal-v2/portal-state.js';
import {mergeProjectState} from '../portal-v2/project-state.js';

const authored={portal:{profile:{employees:13},metrics:{revenue:0},tasks:{items:[{id:'owned'}]},notes:{items:[{id:'n'}]}}};
test('historical: explicitly absent external project collections cannot erase customer answers',()=>{
 const out=mergeProjectState(authored,{quote:{title:'Verified provider quote',inhoud:{summary:'Only supplied source'}}});
 assert.deepEqual(out.portal.tasks,authored.portal.tasks);
 assert.deepEqual(out.portal.notes,authored.portal.notes);
 assert.equal(out.portal.metrics.revenue,0);
 assert.deepEqual(authored.portal.tasks.items,[{id:'owned'}]);
});
test('shadow: signed user projection ACK is insufficient if actual edited values did not persist',async()=>{
 const user={id:'a',jwt:async()=> 'auth-token'};
 const fetchImpl=async(url,options={})=>{
  if(url==='/api/portal-business-input')return {ok:true,status:200,json:async()=>({stored:true,stale:false,authorityStored:true,powerhouseFeedStored:true,organismImpactStored:true,sourceRevision:'src',brainRecordId:'brain',currentStateRecordId:'current',organismImpactRecordId:'impact'})};
  if(url==='/api/portal-state'&&options.method==='POST')return {ok:true,status:200,json:async()=>({stored:true,stale:false})};
  return {ok:true,status:200,json:async()=>({portal:{...authored.portal,profile:{employees:12}}})};
 };
 await assert.rejects(()=>createPortalStateClient({identityProvider:()=>({currentUser:()=>user}),fetchImpl}).write(authored),/PORTAL_STATE_VALUE_READBACK_MISMATCH/);
});
test('canary: each nested value is independently required, additional external fields do not invalidate',()=>{
 assert.equal(portalAuthoringReadbackMatches(authored.portal,{...authored.portal,external:{verified:true}}),true);
 assert.equal(portalAuthoringReadbackMatches(authored.portal,{...authored.portal,profile:{employees:12}}),false);
 assert.equal(portalAuthoringReadbackMatches({metrics:{revenue:0}},{metrics:{revenue:null}}),false);
 assert.equal(portalAuthoringReadbackMatches({notes:{items:[]}},{notes:{items:[{id:'n'}]}}),false);
});
