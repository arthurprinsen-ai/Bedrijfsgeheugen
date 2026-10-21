import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createPortalBusinessInputHandler} from '../platform/api/portal-business-input-handler.mjs';

// Replay each versioned taxonomy declaration, not a test-only allowlist.
function admitted(column){
 let values=[];
 for(const name of readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort()){
  const sql=readFileSync('supabase/migrations/'+name,'utf8');
  for(const match of sql.matchAll(new RegExp('check\\s*\\(\\s*'+column+'\\s+in\\s*\\(([^)]+)\\)','gi')))
   values=[...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
 }
 return new Set(values);
}

test('the real portal writer emits only record types and kinds admitted by the versioned database',async()=>{
 const types=admitted('record_type'),kinds=admitted('record_kind');
 const records=[];
 const handler=createPortalBusinessInputHandler({
  getUser:async()=>({id:'user-a',app_metadata:{tenantId:'tenant-a'}}),
  store:{getLayer:async()=>null,putCanonical:async(_tenant,record)=>({stored:true,record})},
  authority:{append:async({record})=>{
   assert.ok(types.has(record.type),'database rejects record type '+record.type);
   assert.ok(kinds.has(record.kind),'database rejects record kind '+record.kind);
   records.push(record);return {authority:'supabase:brain_records',record};
  }}
 });
 const response=await handler(new Request('https://www.bedrijfsgeheugen.nl/api/portal-business-input',{
  method:'POST',headers:{'content-type':'application/json',authorization:'Bearer fixture-only'},
  body:JSON.stringify({inputType:'PortalDomainStateSnapshot',modelId:'portal-v2-domain-state',sourcePortal:'portal-v2',answers:{portal:{company:{name:'Test fixture'}}}})
 }));
 const body=await response.json();
 assert.equal(response.status,200,JSON.stringify(body));
 assert.equal(records.length,4);
 assert.equal(body.authorityStored,true);
 assert.equal(body.powerhouseFeedStored,true);
 assert.equal(body.organismImpactStored,true);
 assert.ok(!types.has('FabricatedApproval'));
 assert.ok(!kinds.has('unverified_override'));
});

test('the active V2 connector API saves and reopens edits with tenant isolation',async()=>{
 const {createConnectorApi}=await import('../assets/js/koppelingen/api.js');
 const {handlePortalConnectorsRequest}=await import('../platform/api/portal-connectors-handler.mjs');
 const rows=new Map();
 const store={configured:true,
  get:async(tenant,id)=>structuredClone(rows.get(tenant+':'+id)||null),
  saveDraft:async(tenant,definition)=>{
   const saved={...structuredClone(definition),id:definition.id||'11111111-1111-4111-8111-111111111111'};
   rows.set(tenant+':'+saved.id,saved);return saved;
  }
 };
 const api=tenant=>createConnectorApi({fetchFn:(url,options)=>handlePortalConnectorsRequest({
  request:new Request('https://www.bedrijfsgeheugen.nl'+url,options),
  user:{id:'user-'+tenant,app_metadata:{tenantId:tenant}},store
 })});
 const first=api('fixture-a');
 const saved=await first.createDraft({name:'Invoice fixture',source:{type:'upload',config:{folder:'inbox'}},target:{type:'datahub'},mappings:[{sourceField:'invoice',targetField:'reference'}]});
 const changed={...saved,source:{...saved.source,config:{folder:'review'}},mappings:[{sourceField:'invoice',targetField:'external_reference'}]};
 await first.saveDraft(saved.id,changed);
 const reopened=await first.get(saved.id);
 assert.equal(reopened.source.config.folder,'review');
 assert.equal(reopened.mappings[0].targetField,'external_reference');
 assert.equal(reopened.state,'Draft');
 assert.equal(reopened.version,2);
 await assert.rejects(api('fixture-b').get(saved.id),error=>error.status===404);
 await assert.rejects(api('fixture-b').saveDraft(saved.id,changed),error=>error.status===404);
 assert.throws(()=>first.activate(saved.id),/TEST_EVIDENCE_REQUIRED/);
});
