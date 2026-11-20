/** Existing Security Operations worker: read-only, bounded, authorized owned URLs only.
 * A green check covers this bounded HTTP probe, NOT absence of vulnerabilities.
 * Incidents are deduplicated and escalated by the existing workflow, never by
 * direct public vulnerability disclosure or unapproved deployment.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {evaluateHeaders} from './verify-public-security-headers.mjs';

const HERE=dirname(fileURLToPath(import.meta.url));
const inventoryPath=resolve(HERE,'../../config/security-managed-sites.json');
export const sha=value=>createHash('sha256').update(value).digest('hex').slice(0,16);
const allowedHost=h=>h==='www.bedrijfsgeheugen.nl'||h==='bedrijfsgeheugen.nl'||h.endsWith('.netlify.app');
const readable=e=>String(e?.name||'PROBE_FAILED').replace(/[^A-Z0-9 _-]/gi,'').slice(0,45);
export function validateInventory(config){
 if(!config||config.version!==1||!Array.isArray(config.sites)||config.sites.length<config.expected_projects)
  throw Error('INCOMPLETE_SECURITY_INVENTORY');
 const ids=new Set(),urls=new Set();
 for(const s of config.sites){
  const u=new URL(s.url);
  if(!/^[a-z0-9-]{3,75}$/.test(s.id)||ids.has(s.id)||urls.has(s.url)||u.protocol!=='https:'||!allowedHost(u.hostname)||u.username||u.password||u.search||u.hash)
   throw Error('INVALID_SITE_OR_DUPLICATE_INVENTORY');
  if(!['critical','standard','protected','archive'].includes(s.mode))throw Error('INVALID_MONITORING_MODE');
  ids.add(s.id);urls.add(s.url);
 }
 if(!ids.has('bedrijfsgeheugen')||!ids.has('pw-zaalcoach')||!ids.has('pw-veldcoach'))throw Error('REQUIRED_PRODUCTION_SITE_MISSING');
 return config;
}
export function classifyResponse(site,response){
 const status=Number(response.status),h=response.headers;
 if(site.mode==='protected'){
  if(status===401||status===403)return {status:'VERIFIED',code:'PROTECTED_GATE_OBSERVED'};
  if(status>=200&&status<400)return {status:'FAIL',code:'UNEXPECTED_PUBLIC_ACCESS'};
  return {status:'WARN',code:'PROTECTION_NOT_PROVEN'};
 }
 if(site.mode==='archive'){
  if(status===401||status===403||status===404||status===410)return {status:'VERIFIED',code:'ARCHIVE_RESTRICTED_OR_GONE'};
  if(status>=200&&status<400)return {status:'WARN',code:'ARCHIVE_EXPOSURE_REVIEW'};
  return {status:'WARN',code:'ARCHIVE_STATUS_UNCERTAIN'};
 }
 if(status<200||status>=400)return {status:site.mode==='critical'?'FAIL':'WARN',code:'WEBSITE_NOT_AVAILABLE'};
 const u=new URL(response.url||site.url);
 if(!allowedHost(u.hostname)||u.protocol!=='https:')return {status:'FAIL',code:'UNEXPECTED_REDIRECT'};
 const checked=evaluateHeaders(h,site.mode==='coach'?'coach':'business');
 if(site.mode==='critical'&&!checked.passed)return {status:'FAIL',code:'CRITICAL_HEADERS_INCOMPLETE',missing:checked.missing};
 if(site.mode==='standard'){
  if((h.get('x-content-type-options')||'').toLowerCase()!=='nosniff'||!(h.get('strict-transport-security')||'').includes('max-age='))
   return {status:'WARN',code:'STANDARD_SECURITY_HEADERS_INCOMPLETE'};
 }
 return {status:'VERIFIED',code:'BOUNDED_HTTP_CHECK_PASSED'};
}
async function head(site,fetcher){
 const url=site.url,options={method:'HEAD',redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(9000),headers:{'user-agent':'BG-Security-Operations-ReadOnly/1.0'}};
 const first=await fetcher(url,options);
 if(first.status===405||first.status===501){await first.body?.cancel?.();return fetcher(url,{...options,method:'GET',headers:{...options.headers,range:'bytes=0-0'}});}
 return first;
}
export async function probeSite(site,fetcher=fetch){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await head(site,fetcher);
   try{return {id:site.id,mode:site.mode,...classifyResponse(site,response)};}
   finally{await response.body?.cancel?.().catch(()=>{});}
  }catch(e){last=e;}
 }
 return {id:site.id,mode:site.mode,status:site.mode==='critical'?'FAIL':'WARN',code:'PROBE_UNAVAILABLE',reason:readable(last)};
}
const PRIVATE_SOURCE_PATHS=[
 '/supabase/migrations/20261014124402_scoped_external_reconcile_auth_retry_20261014.sql',
 '/scripts/security-operations-proof.mjs','/config/brain-delivery-system.json','/package.json'
];
export async function checkPrivateSourceExposure(fetcher=fetch){
 const issues=[];
 for(const pathname of PRIVATE_SOURCE_PATHS){
  try{
   const r=await fetcher('https://www.bedrijfsgeheugen.nl'+pathname,{method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(9000)});
   try{
    if(r.status!==404)issues.push({id:'bedrijfsgeheugen',mode:'critical',status:'FAIL',code:'PRIVATE_SOURCE_NOT_404',fingerprint:sha('PRIVATE_SOURCE:'+pathname),pathHash:sha(pathname),httpStatus:r.status});
   }finally{await r.body?.cancel?.().catch(()=>{});}
  }catch{issues.push({id:'bedrijfsgeheugen',mode:'critical',status:'FAIL',code:'PRIVATE_SOURCE_PROBE_UNAVAILABLE',fingerprint:sha('PRIVATE_SOURCE_PROBE:'+pathname)});}
 }
 return issues;
}
export function summarizeReport(results,checkedAt=new Date().toISOString(),expiresMinutes=45){
 const invalidDate=Date.parse(checkedAt);if(!Number.isFinite(invalidDate))throw Error('INVALID_CHECK_TIME');
 const issues=results.filter(r=>r.status!=='VERIFIED');
 const critical=issues.filter(r=>r.status==='FAIL');
 const status=critical.length?'FAIL':issues.length?'WARN':'VERIFIED';
 const expiresAt=new Date(invalidDate+expiresMinutes*60000).toISOString();
 return {schemaVersion:1,checkedAt,expiresAt,monitor:'existing-security-operations-proof',status,
  total:results.length,verified:results.length-issues.length,warning:issues.length-critical.length,failed:critical.length,
  issues:issues.map(x=>({fingerprint:x.fingerprint||sha(x.id+':'+x.code),severity:x.status==='FAIL'?'HIGH':'REVIEW',code:x.code,siteHash:sha(x.id)})),
  sites:results.map(x=>({id:x.id,status:x.status,code:x.code})),evidenceAvailable:true};
}
export async function runSecurityGuardian({fetcher=fetch,config,now=new Date()}={}){
 const cfg=validateInventory(config||JSON.parse(await readFile(inventoryPath,'utf8')));
 const results=[];
 const concurrency=4;let at=0;
 const workers=Array.from({length:concurrency},async()=>{
  while(at<cfg.sites.length){const site=cfg.sites[at++];results.push(await probeSite(site,fetcher));}
 });
 await Promise.all(workers);results.sort((a,b)=>a.id.localeCompare(b.id));
 results.push(...await checkPrivateSourceExposure(fetcher));
 return summarizeReport(results,now.toISOString(),cfg.expiry_minutes);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=await runSecurityGuardian();
 const output=process.argv.indexOf('--output');
 if(output!==-1&&process.argv[output+1])await writeFile(process.argv[output+1],JSON.stringify(report,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify({status:report.status,checkedAt:report.checkedAt,expiresAt:report.expiresAt,total:report.total,verified:report.verified,warning:report.warning,failed:report.failed,issueCodes:[...new Set(report.issues.map(x=>x.code))]}));
}
