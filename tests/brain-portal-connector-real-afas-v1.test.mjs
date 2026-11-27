import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 validateAfasSource,afasAuthHeader,readAfasGetConnector,afasSafeProbe
} from '../platform/connectors/afas-live-source.mjs';
import {handlePortalConnectorsRequest} from '../platform/api/portal-connectors-handler.mjs';
import {verifiedConnectorRecord} from '../portal-v2/verified-connector-data.js';

const tenant='11111111-1111-4111-8111-111111111111',cid='22222222-2222-4222-8222-222222222222';
const token='<token><version>1</version><data>AFAS-secret-with-scope</data></token>';
const source={type:'afas',environment:'12345',getConnector:'BG_Verkoop',personalDataAuthorized:false};
const connector=(fields=['Bedrag'])=>({
 id:cid,tenantId:tenant,name:'AFAS Verkoop',source,version:2,state:'Active',
 target:{type:'datahub'},dataUse:{mode:'PORTAL_INSIGHTS',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'},
 routing:{portalPages:['cijfers-maatstaven'],selectedFields:fields},schedule:{refreshMinutes:1440}
});
const sourceResult=(fields=['Bedrag'])=>({
 provider:'afas',getConnector:'BG_Verkoop',environment:'12345',fields,
 rows:[[0],[100]],recordCount:2,sourceHash:'a'.repeat(64),
 proofLevel:'PROVIDER_VERIFIED',sourceReadSuccess:true,capturedAt:'2026-11-22T15:00:00Z'
});
const snapshot=(c=connector())=>({
 organisatie_id:tenant,connector_id:cid,connector_versie:c.version,provider:'afas',
 get_connector:'BG_Verkoop',kolommen:c.routing.selectedFields,rijen:[[0],[100]],
 aantal:2,bron_hash:'a'.repeat(64),bron_gecontroleerd:true,ingelezen_op:'2026-11-22T15:01:00Z'
});
const req=(method,path,body)=>({method,url:'https://www.bedrijfsgeheugen.nl'+path,
 ...(body?{body:JSON.stringify(body)}:{})});
const user={id:'user-one',app_metadata:{tenant_id:tenant}};
const handler=(request,{store,afasReader,authUser=user}={})=>handlePortalConnectorsRequest({
 request,user:authUser,store,afasReader,
 sovereignty:{assertConnectorAllowed:async()=>true},
 engine:{activationEligibility:()=>({eligible:false,reason:'NOT_TESTED'})}
});
function fakeStore(c=connector()){
 let savedSnapshot=null,credential=null;const events=[];
 return {
  events,configured:true,list:async()=>[c],get:async(t,id)=>t===tenant&&id===cid?c:null,
  listSourceSnapshots:async()=>savedSnapshot?[savedSnapshot]:[],
  checkSourceStorage:async()=>true,
  setAfasCredential:async(t,id,value)=>{events.push('vault-write');credential=value;return true;},
  readAfasCredential:async()=>credential||token,
  saveExecution:async(t,item)=>{events.push('execution:'+item.status);return {id:'33333333-3333-4333-8333-333333333333',...item};},
  saveSourceSnapshot:async(t,body)=>{events.push('source-write');savedSnapshot={
    organisatie_id:t,connector_id:body.connectorId,connector_versie:body.version,provider:body.provider,
    get_connector:body.getConnector,kolommen:body.fields,rijen:body.rows,
    aantal:body.rows.length,bron_hash:body.hash,bron_gecontroleerd:true,ingelezen_op:new Date().toISOString()
   };return savedSnapshot;},
  getSourceSnapshot:async()=>savedSnapshot,
  revokeAfasCredential:async()=>{events.push('vault-revoke');savedSnapshot=null;credential=null;return true;},
  saveDraft:async(t,draft)=>({id:cid,...draft})
 };
}
test('AFAS source URL is fixed to one validated official HTTPS API host; no SSRF or redirects',()=>{
 assert.equal(validateAfasSource(source).url,
  'https://12345.rest.afas.online/ProfitRestServices/connectors/BG_Verkoop?skip=0&take=100');
 for(const env of ['localhost','127.0.0.1','12345.rest.afas.online','12.3','999999999999','https://internal']){
  assert.throws(()=>validateAfasSource({...source,environment:env}),/INVALID_AFAS_ENVIRONMENT/);
 }
 for(const id of ['../../admin','https://evil.com','BG_Leads?skip=0','a'.repeat(100)]){
  assert.throws(()=>validateAfasSource({...source,getConnector:id}),/INVALID_GET_CONNECTOR/);
 }
});
test('AFAS XML token is encoded as provider requires, opaque token alone cannot reach another host',()=>{
 assert.equal(afasAuthHeader(token),'AfasToken '+Buffer.from(token).toString('base64'));
 assert.equal(afasAuthHeader(Buffer.from(token).toString('base64')),'AfasToken '+Buffer.from(token).toString('base64'));
 assert.throws(()=>afasAuthHeader('password'),/INVALID_AFAS_CREDENTIAL/);
 assert.throws(()=>afasAuthHeader('a'.repeat(50)),/AFAS_TOKEN_XML_REQUIRED/);
});
test('real AFAS response returns only customer-selected columns, including true 0 values',async()=>{
 let url='',header='',redirect='';
 const fetchFn=async(u,options)=>{url=u;header=options.headers.authorization;redirect=options.redirect;
  return new Response(JSON.stringify({rows:[{Factuur:'F-001',Bedrag:0,Email:'a@example.nl',token:'NEVER'},
   {Factuur:'F-002',Bedrag:100,Email:'b@example.nl',token:'NEVER'}]}),{status:200});};
 const result=await readAfasGetConnector({source,credential:token,fetchFn,selectedFields:['Factuur','Bedrag']});
 assert.equal(url,validateAfasSource(source).url);assert.equal(redirect,'error');
 assert.equal(header,afasAuthHeader(token));assert.deepEqual(result.rows,[['F-001',0],['F-002',100]]);
 assert.deepEqual(result.fields,['Factuur','Bedrag']);assert.equal(result.sourceHash.length,64);
 assert.equal(result.proofLevel,'PROVIDER_VERIFIED');
 assert.equal(JSON.stringify(result).includes('NEVER'),false);
});
test('AFAS probe returns column names but no private values; personal and secret fields fail closed',async()=>{
 const fetchFn=async()=>new Response(JSON.stringify({rows:[{Bedrag:10,Email:'secret@example.nl',access_token:'NOPE'}]}),{status:200});
 const draft=await readAfasGetConnector({source,credential:token,fetchFn,probeOnly:true});
 assert.equal(draft.fields.includes('Email'),true);
 assert.equal(draft.fields.includes('access_token'),false);
 const proof=afasSafeProbe(draft);
 assert.equal(proof.datasetPreviewIncluded,false);assert.equal(proof.recordValuesPersisted,false);
 assert.equal(JSON.stringify(proof).includes('secret@example.nl'),false);
 await assert.rejects(readAfasGetConnector({source,credential:token,fetchFn,selectedFields:['Email']}),/AFAS_PERSONAL_FIELDS_NEED_CONSENT/);
 await assert.rejects(readAfasGetConnector({source,credential:token,fetchFn,selectedFields:['access_token'],personalAuthorized:true}),/AFAS_RESTRICTED_FIELDS_BLOCKED/);
});
test('AFAS provider failures and too-large responses never create fake VERIFIED status',async()=>{
 await assert.rejects(readAfasGetConnector({source,credential:token,fetchFn:async()=>new Response('{}',{status:401})}),/AFAS_PROVIDER_AUTH_REQUIRED/);
 await assert.rejects(readAfasGetConnector({source,credential:token,fetchFn:async()=>new Response('[]',{status:200})}),/AFAS_ROWS_NOT_RETURNED/);
 await assert.rejects(readAfasGetConnector({source,credential:token,fetchFn:async()=>new Response(JSON.stringify({rows:[]}),{status:200})}),/AFAS_NO_ROWS_TO_VERIFY/);
 await assert.rejects(readAfasGetConnector({source,credential:token,fetchFn:async()=>new Response('a'.repeat(260001),{status:200})}),/AFAS_RESPONSE_TOO_LARGE/);
});
test('page-records returns verified tenant rows only for active exact-version authorized routes',async()=>{
 const c=connector(),snap=snapshot(c);
 const store={configured:true,list:async()=>[c],listSourceSnapshots:async()=>[snap]};
 const result=await (await handler(req('GET','/api/connectors/page-records?page=cijfers-maatstaven'),{store})).json();
 assert.equal(result.truth,'ACTUAL_TENANT_SOURCE_RECORDS');
 assert.deepEqual(result.items[0].rows,[[0],[100]]);
 assert.equal(result.items[0].proofLevel,'PROVIDER_VERIFIED');
 const wrong=await (await handler(req('GET','/api/connectors/page-records?page=mensen'),{store})).json();
 assert.deepEqual(wrong.items,[]);
 assert.equal((await handler(req('GET','/api/connectors/page-records?page=cijfers-maatstaven'),{store,authUser:null})).status,401);
 for(const broken of [
  {...snap,connector_versie:1},{...snap,organisatie_id:'99999999-9999-4999-8999-999999999999'},
  {...snap,kolommen:['Other']},{...snap,bron_gecontroleerd:false}
 ]){
  const invalid={...store,listSourceSnapshots:async()=>[broken]};
  assert.deepEqual((await (await handler(req('GET','/api/connectors/page-records?page=cijfers-maatstaven'),{store:invalid})).json()).items,[]);
 }
 assert.deepEqual((await (await handler(req('GET','/api/connectors/page-records?page=cijfers-maatstaven'),{store:{...store,list:async()=>[{...c,state:'Draft'}]}})).json()).items,[]);
});
test('probe with real provider proof stores token only in Vault and never returns actual values',async()=>{
 const c=connector([]),store=fakeStore(c);
 const response=await handler(req('POST','/api/connectors/'+cid+'/probe',{credential:token}),{
  store,afasReader:async()=>({ ...sourceResult(['Bedrag']),rows:[[77]],recordCount:1})
 });
 const payload=await response.json();
 assert.equal(payload.status,'FIELD_SELECTION_REQUIRED');assert.equal(payload.connectionVerified,true);
 assert.equal(JSON.stringify(payload).includes('77'),false);assert.equal(JSON.stringify(payload).includes('AFAS-secret'),false);
 assert.ok(store.events.includes('vault-write'));assert.equal(store.events.some(x=>x.startsWith('execution:')),false);
});
test('selected real provider proof gives version-bound activation receipt; no sample data',async()=>{
 const store=fakeStore();
 const response=await handler(req('POST','/api/connectors/'+cid+'/probe',{}),{
  store,afasReader:async()=>sourceResult()
 });
 const payload=await response.json();
 assert.equal(payload.status,'TEST_PASSED');assert.equal(payload.evidence.proofLevel,'PROVIDER_VERIFIED');
 assert.equal(payload.evidence.configVersion,2);
 assert.ok(store.events.includes('execution:TEST_PASSED'));
 assert.equal(payload.recordValuesPersisted,false);
});
test('connection-only provider authorization never silently authorizes portal records',async()=>{
 const c={...connector([]),target:{type:'source-only'},
   dataUse:{mode:'CONNECTION_ONLY',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'},
   routing:{portalPages:[],selectedFields:[]}};
 const store=fakeStore(c);
 const proof=await (await handler(req('POST','/api/connectors/'+cid+'/probe',{}),{
   store,afasReader:async()=>sourceResult()
 })).json();
 assert.equal(proof.status,'TEST_PASSED');
 assert.equal(proof.evidence.proofLevel,'PROVIDER_VERIFIED');
 const rejected=await handler(req('POST','/api/connectors/'+cid+'/sync',{}),{store,
   afasReader:async()=>sourceResult()});
 assert.equal(rejected.status,409);
 assert.equal((await rejected.json()).error,'PORTAL_DATA_USE_NOT_AUTHORIZED');
 const list=await (await handler(req('GET','/api/connectors/page-records?page=cijfers-maatstaven'),{store})).json();
 assert.deepEqual(list.items,[]);
});
test('active sync must independently read back exact tenant row data and record receipt',async()=>{
 const store=fakeStore();
 const response=await handler(req('POST','/api/connectors/'+cid+'/sync',{}),{
  store,afasReader:async()=>sourceResult()
 });
 const payload=await response.json();
 assert.equal(payload.status,'SOURCE_SYNCED');assert.equal(payload.recordCount,2);
 assert.equal(payload.truth,'ACTUAL_TENANT_SOURCE_RECORDS');
 assert.ok(store.events.indexOf('source-write')<store.events.indexOf('execution:SOURCE_SYNCED'));
 const records=await (await handler(req('GET','/api/connectors/page-records?page=cijfers-maatstaven'),{store})).json();
 assert.deepEqual(records.items[0].rows,[[0],[100]]);
});
test('revoking locally removes Vault credentials and snapshots, and warns about provider-side revocation',async()=>{
 const store=fakeStore();
 const response=await handler(req('POST','/api/connectors/'+cid+'/revoke',{}),{store});
 const payload=await response.json();
 assert.equal(payload.status,'REVOKED_LOCALLY');
 assert.equal(payload.providerTokenRevokeRequired,true);
 assert.ok(store.events.includes('vault-revoke'));
});
test('UI and database enforce source proof, no public RLS access, no browser tokens in drafts',async()=>{
 const [ui,portal,sql,store,api,handlerCode]=await Promise.all([
  readFile(new URL('../assets/js/koppelingen/afas-live-ui.js',import.meta.url),'utf8'),
  readFile(new URL('../portal-v2/verified-connector-data.js',import.meta.url),'utf8'),
  readFile(new URL('../supabase/migrations/20261122162147_portal_connector_real_afas_source_readback_v1.sql',import.meta.url),'utf8'),
  readFile(new URL('../netlify/functions/_portal-connectors-store.mjs',import.meta.url),'utf8'),
  readFile(new URL('../assets/js/koppelingen/api.js',import.meta.url),'utf8'),
  readFile(new URL('../platform/api/portal-connectors-handler.mjs',import.meta.url),'utf8')
 ]);
 assert.match(ui,/api\.probe\(draft\.id/);assert.match(ui,/api\.activate\(draft\.id/);assert.match(ui,/api\.sync\(draft\.id/);
 assert.match(ui,/token\.value=''/);assert.match(ui,/personalDataAuthorized/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage/);
 assert.match(portal,/ACTUAL_TENANT_SOURCE_RECORDS/);assert.match(portal,/getIdentity\(\)!==identity/);
 assert.match(sql,/alter table public\.connector_source_snapshots_v1 enable row level security/i);
 assert.match(sql,/revoke all on public\.connector_source_snapshots_v1 from public,anon,authenticated/i);
 assert.match(sql,/grant execute on function public\.connector_afas_vault_read\(uuid,uuid\) to service_role/i);
 assert.match(store,/rpc\/connector_afas_vault_read/);assert.match(store,/bron_hash/);
 assert.match(handlerCode,/readAfasGetConnector/);assert.match(handlerCode,/tenantRecordReadback:true/);
 assert.match(api,/page-records/);
 assert.deepEqual(verifiedConnectorRecord({}),null);
 const valid={id:cid,provider:'afas',truth:'ACTUAL_TENANT_SOURCE_RECORDS',proofLevel:'PROVIDER_VERIFIED',
  columns:['Bedrag'],rows:[[0],[100]],recordCount:2,sourceHash:'a'.repeat(64)};
 assert.equal(verifiedConnectorRecord(valid),valid);
 assert.equal(verifiedConnectorRecord({...valid,rows:[[0]]}),null);
});
