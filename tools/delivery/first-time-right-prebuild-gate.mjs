// Canonical Powerhouse admission: find repeatable source defects BEFORE expensive build/CI.
// Import from protected main rather than the mutable candidate PR.
import { stripTypeScriptTypes } from 'node:module';
import { spawnSync } from 'node:child_process';
export const CONTRACT_VERSION='ONE-BRAIN-FIRST-TIME-RIGHT-PREBUILD-v1';
const executable=p=>/^supabase\/functions\/.*\.(?:ts|mts|js|mjs)$/.test(p)||/^netlify\/functions\/.*\.(?:ts|js|mjs)$/.test(p)||/^tools\/delivery\/.*\.mjs$/.test(p)||/^brain\/production\/.*\.mjs$/.test(p);
const migration=p=>/^supabase\/migrations\/[^/]+\.sql$/.test(p);
const regression=p=>/^tests\/.*\.test\.(?:mjs|js|cjs)$/.test(p);
export function firstTimeRightFailureEvidence(reasons,obligationId=''){
 return Object.freeze({contract:CONTRACT_VERSION,status:'BLOCKED_BEFORE_BUILD',fingerprint:'powerhouse|prebuild|'+String(reasons[0]?.code||'unknown').toLowerCase(),obligation_id:obligationId||null,owner:'original candidate writer + original delivery admission owner',cause:reasons.map(r=>({code:r.code,path:r.path||null,explanation:r.explanation})),prevention:'Repair original source plus regression before build; rerun exact-head protected checks.',regression_required:true,repair_scope:'same original obligation/PR and exclusive writer lease',provider_side_effect_allowed:false,evidence_needed:['tested source','protected merge','exact production readback','original authorized run','independent provider outcome','learning and skill writeback'],must_not:['force GREEN','duplicate publisher','weaken approval/identity/auth/anti-duplicate','replay unknown side effects']});
}
const diagnostic=p=>p.error?String(p.error.message).slice(0,300):(String(p.stderr||'').match(/(?:SyntaxError|Error):[^\n]*/)?.[0]||'Module syntax rejected').slice(0,300);
export async function evaluateFirstTimeRightPrebuild({changedPaths=[],readSource,obligationId=''}={}){
 const paths=[...new Set(changedPaths.map(x=>String(x||'').trim()).filter(Boolean))].sort(),changedSource=paths.filter(p=>executable(p)||migration(p)),checks=[],reasons=[];
 const reject=(code,path,explanation)=>reasons.push({code,path:path||null,explanation:String(explanation||'').slice(0,300)});
 if(!changedSource.length)return Object.freeze({ok:true,state:'PREBUILD_NOT_APPLICABLE',checked:[],reasons:[],failure_evidence:null});
 if(typeof readSource!=='function')reject('SOURCE_READER_MISSING',null,'Exact candidate source not accessible.');
 if(changedSource.length>60)reject('PREBUILD_SCOPE_EXCEEDED',null,'More than 60 changed source files, split by owner.');
 if(!paths.some(regression))reject('REGRESSION_TEST_MISSING',null,'Changed source/schema needs same-candidate regression.');
 for(const path of changedSource.slice(0,60)){
  if(typeof readSource!=='function')break;
  if(!/^[\w.\-/]+$/.test(path)||path.split('/').includes('..')){reject('SOURCE_PATH_INVALID',path,'Outside verified candidate tree.');continue;}
  let source;
  try{source=await readSource(path);}catch(e){reject('SOURCE_READ_FAILED',path,e?.code||'unavailable');continue;}
  if(typeof source!=='string'||Buffer.byteLength(source,'utf8')>1000000){reject('SOURCE_UNAVAILABLE_OR_OVERSIZED',path,'Missing/oversized source.');continue;}
  if(migration(path)){
   const count=new Map();
   for(const m of source.matchAll(/\$[A-Za-z_][A-Za-z_0-9]*\$|\$\$/g)){const key=m[0].toLowerCase();count.set(key,(count.get(key)||0)+1);}
   for(const [tag,n] of count){if(n%2)reject('SQL_DOLLAR_QUOTE_UNBALANCED',path,tag+' appears '+n+' times.');}
   checks.push({path,check:'DOLLAR_QUOTE_BALANCE'});continue;
  }
  let compiled=source;
  if(/\.(?:ts|mts)$/.test(path)){try{compiled=stripTypeScriptTypes(source,{mode:'transform',sourceUrl:path});}catch(e){reject('TYPESCRIPT_TRANSFORM_FAILED',path,e?.message||'transform error');continue;}}
  const parsed=spawnSync(process.execPath,['--check','--input-type=module'],{input:compiled,encoding:'utf8',timeout:8000,maxBuffer:256*1024});
  if(parsed.error||parsed.status!==0)reject('MODULE_SYNTAX_REJECTED',path,diagnostic(parsed));
  checks.push({path,check:'NODE22_MODULE_SYNTAX'});
 }
 const ok=reasons.length===0;
 return Object.freeze({ok,state:ok?'PREBUILD_READY':'BLOCKED_BEFORE_BUILD',checked:checks,reasons,failure_evidence:ok?null:firstTimeRightFailureEvidence(reasons,obligationId),next_gates:['native Required and CodeQL','provider preview','original approval/permission/uniqueness','exact production source and independent outcome readback']});
}
