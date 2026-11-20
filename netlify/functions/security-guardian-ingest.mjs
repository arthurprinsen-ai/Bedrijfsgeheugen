/* Restricted server-only transport into canonical Security Trust Center.
 * This is NOT a customer-accessible write API. The only authorized caller
 * is the original security-operations-proof workflow on protected main,
 * authenticated with fresh signed GitHub Actions OIDC.
 */
import {verifyGitHubActionsOidc} from './_security-guardian-oidc.mjs';
import {createSecurityTrustClient} from './_security-trust-client.mjs';

const respond=(body,status)=>Response.json(body,{status,headers:{
 'cache-control':'private, no-store','vary':'authorization','x-content-type-options':'nosniff'}});
export function validateSecurityGuardianReport(body,now=Date.now()){
 const d=body&&typeof body==='object'&&!Array.isArray(body)?body:null;
 const start=Date.parse(String(d?.checkedAt||'')),end=Date.parse(String(d?.expiresAt||''));
 if(d?.schemaVersion!==1||!Number.isFinite(start)||!Number.isFinite(end)||start>now+60000||
 now-start>300000||end-start!==2700000||end<=now)throw Error('INVALID_SECURITY_HEARTBEAT_TIME');
 if(!['VERIFIED','WARN','FAIL'].includes(d.status)||!Number.isInteger(d.total)||d.total!==21||
 ![d.verified,d.warning,d.failed].every(Number.isInteger)||d.verified<0||d.warning<0||d.failed<0||
 d.verified+d.warning+d.failed!==d.total||d.evidenceAvailable!==true||
 (d.status==='VERIFIED')!==(d.warning===0&&d.failed===0)||
 (d.status==='FAIL')!==(d.failed>0))throw Error('INVALID_SECURITY_HEARTBEAT_COUNTS');
 if(!Array.isArray(d.sites)||d.sites.length!==21||!Array.isArray(d.issues)||d.issues.length!==d.failed+d.warning)
  throw Error('INVALID_SECURITY_HEARTBEAT_EVIDENCE');
 const tallied={VERIFIED:0,WARN:0,FAIL:0};
 for(const item of d.sites)tallied[item.status]=(tallied[item.status]||0)+1;
 if(tallied.VERIFIED!==d.verified||tallied.WARN!==d.warning||tallied.FAIL!==d.failed)
  throw Error('SECURITY_STATUS_COUNT_MISMATCH');
 const counts=new Map();for(const item of d.sites)counts.set(item.id,(counts.get(item.id)||0)+1);
 if(counts.size!==17||counts.get('bedrijfsgeheugen')!==5||
  [...counts].some(([id,n])=>id!=='bedrijfsgeheugen'&&n!==1))
  throw Error('SECURITY_INVENTORY_COVERAGE_INCOMPLETE');
 if(d.issues.filter(x=>x.severity==='HIGH').length!==d.failed||
  d.issues.filter(x=>x.severity==='REVIEW').length!==d.warning||
  d.issues.some(x=>!(/^[a-f0-9]{16}$/.test(String(x.fingerprint||'')))))
  throw Error('SECURITY_ISSUE_EVIDENCE_MISMATCH');
 const ids=d.sites.map(s=>String(s?.id||''));
 if(!ids.includes('bedrijfsgeheugen')||!ids.includes('pw-zaalcoach')||!ids.includes('pw-veldcoach')||
 ids.some(id=>!(/^[a-z0-9-]{3,75}$/.test(id)))||
 d.sites.some(s=>!['VERIFIED','WARN','FAIL'].includes(s.status)||!(/^[A-Z0-9_]{3,60}$/.test(String(s.code||'')))))
 throw Error('INVALID_SECURITY_SITE_EVIDENCE');
 return d;
}
export default async request=>{
 if(request.method!=='POST')return respond({error:'METHOD_NOT_ALLOWED'},405);
 if(!/application\/json/i.test(request.headers.get('content-type')||''))return respond({error:'UNSUPPORTED_MEDIA_TYPE'},415);
 let subject;
 try{subject=await verifyGitHubActionsOidc(request.headers.get('authorization'));}catch{return respond({error:'UNAUTHORIZED'},401);}
 let report;
 try{
  const raw=await request.text();
  if(raw.length>30000)throw Error('PAYLOAD_TOO_LARGE');
  report=validateSecurityGuardianReport(JSON.parse(raw));
 }catch{return respond({error:'INVALID_REPORT'},400);}
 try{
  const client=createSecurityTrustClient();
  await client.observe('canonical',{
   providerKey:'WEBSITE',controlKey:'SECURITY_HEARTBEAT',status:report.status,
   source:'existing-security-operations-proof',expiresAt:report.expiresAt,
   evidence:{scope:'managed-netlify-projects',checkedAt:report.checkedAt,total:report.total,
    verified:report.verified,warning:report.warning,failed:report.failed,runId:subject.runId}
  },'github-actions/security-operations-proof/'+subject.runId);
  const readback=await client.get('canonical');
  const rows=readback?.snapshot?.managementObservations||[];
  const current=rows.find(o=>String(o.control_key||o.controlKey)==='SECURITY_HEARTBEAT'&&
   String(o.provider_key||o.providerKey)==='WEBSITE');
  const expire=Date.parse(String(current?.expires_at||current?.expiresAt||''));
  if(!current||!Number.isFinite(expire)||expire<Date.parse(report.expiresAt)-120000||
   String(current.status||'').toUpperCase()!==report.status)throw Error('INDEPENDENT_SECURITY_READBACK_FAILED');
  return respond({stored:true,readback:true,status:report.status,checkedAt:report.checkedAt,expiresAt:report.expiresAt},200);
 }catch{return respond({error:'SECURITY_HEARTBEAT_WRITE_OR_READBACK_FAILED'},502);}
};
export const config={path:'/api/security-guardian-ingest'};
