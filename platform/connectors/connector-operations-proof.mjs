// Connector Studio health: immutable proof-derived status from original tenant
// definitions/executions and latest independently read-back provider source row.
// Never infer provider connectivity from Active, template, schedule or sample tests.
import {normalizeTransferPolicy,transferSummary} from '../../assets/js/koppelingen/transfer-policy.js';

const UTC_DATE=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?x:null;
const positiveCount=x=>Number.isInteger(Number(x))&&Number(x)>=0&&Number(x)<=100;
const SHA=/^[0-9a-f]{64}$/;
export function connectorHealthReport({connector,tenantId,executions=[],snapshot=null,now=new Date()}={}){
 if(!connector?.id||!tenantId||connector.tenantId&&connector.tenantId!==tenantId)
  throw new TypeError('CONNECTOR_SCOPE_INVALID');
 const version=Number(connector.version);
 if(!Number.isInteger(version)||version<1)throw new TypeError('CONNECTOR_VERSION_INVALID');
 let policy=null;
 try{policy=normalizeTransferPolicy(connector.transferPolicy,connector.documentSchema);}
 catch{/* Invalid legacy/config should never be represented as running. */}
 const summary=policy?transferSummary(policy):null;
 const history=Array.isArray(executions)?executions:[];
 const matching=history.filter(row=>row&&String(row.connector_id??row.connectorId)===String(connector.id)
   &&String(row.organisatie_id??row.tenantId)===String(tenantId)
   &&Number(row.connector_versie??row.connectorVersion)===version);
 const providerProbe=matching.find(row=>
   row.status==='TEST_PASSED'&&row.evidence?.proofLevel==='PROVIDER_VERIFIED'
   &&row.evidence?.sourceReadSuccess===true);
 const provenance=matching.find(row=>row.status==='SOURCE_SYNCED'
   &&row.evidence?.proofLevel==='PROVIDER_VERIFIED'
   &&row.evidence?.tenantRecordReadback===true
   &&row.evidence?.provider==='afas'
   &&row.evidence?.sourceReadSuccess===true
   &&SHA.test(String(row.evidence?.sourceHash||'')));
 const source= snapshot&&
   snapshot.organisatie_id===tenantId&&snapshot.connector_id===connector.id&&
   Number(snapshot.connector_versie)===version&&
   snapshot.bron_gecontroleerd===true&&snapshot.provider==='afas'&&
   snapshot.get_connector===connector.source?.getConnector&&
   SHA.test(String(snapshot.bron_hash||''))&&
   Number(snapshot.aantal)>=0&&positiveCount(snapshot.aantal)&&
   Array.isArray(snapshot.rijen)&&snapshot.rijen.length===Number(snapshot.aantal)&&
   Array.isArray(snapshot.kolommen)&&snapshot.kolommen.length>0&&
   Array.isArray(connector.routing?.selectedFields)&&
   JSON.stringify(snapshot.kolommen)===JSON.stringify(connector.routing.selectedFields)&&
   provenance?.evidence?.sourceHash===snapshot.bron_hash&&
   UTC_DATE(snapshot.ingelezen_op)&&UTC_DATE(provenance?.afgerond_op??provenance?.completedAt)&&
   Date.parse(provenance.afgerond_op??provenance.completedAt)>=Date.parse(snapshot.ingelezen_op)-10_000
   ?snapshot:null;
 const capturedAt=source?UTC_DATE(source.ingelezen_op):null;
 const ageMinutes=capturedAt?Math.max(0,Math.floor((now.getTime()-Date.parse(capturedAt))/60000)):null;
 // There is no canonical scheduled execution receipt for these new policies.
 // Never compute "next run" or "on schedule" from an interval setting.
 const cadence=summary?.cadence||'Onbekend';
 const verified=Boolean(source&&connector.state==='Active');
 const connectionVerified=Boolean((providerProbe||verified)&&connector.state==='Active');
 const latest=matching[0]||null; // original query is ordered newest-first.
 return Object.freeze({
   contract:'CONNECTOR_PROOF_HEALTH_V1',connectorId:connector.id,connectorVersion:version,
   configurationState:connector.state||'Draft',
   requestedDirection:summary?.direction||'Onbekend',requestedCadence:cadence,
   requestedMode:policy?.mode||'Onbekend',
   automaticExecutionVerified:false,nextScheduledAt:null,
   connectionVerified,actualSourceDataVerified:verified,
   status:verified?'SOURCE_RECORDS_VERIFIED':connectionVerified?'PROVIDER_CONNECTION_VERIFIED':'EVIDENCE_DUE',
   lastSourceReadAt:verified?capturedAt:null,sourceAgeMinutes:verified?ageMinutes:null,
   sourceRecordCount:verified?Number(source.aantal):null,
   lastExecutionAt:UTC_DATE(latest?.afgerond_op??latest?.completedAt??latest?.gestart_op)??null,
   lastExecutionState:typeof latest?.status==='string'?latest.status:null,
   evidenceReason:verified?'EXACT_VERSION_TENANT_PROVIDER_HASH_AND_ROW_READBACK':
     connectionVerified?'PROVIDER_PROBE_ONLY_NO_CONFIRMED_PORTAL_ROWS':
     'NO_PROVIDER_READBACK_FOR_CURRENT_TENANT_VERSION',
   // Deliberately no raw source records, column values, tokens or endpoint URL.
 });
}
