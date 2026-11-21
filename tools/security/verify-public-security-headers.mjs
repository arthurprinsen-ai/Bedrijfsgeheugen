/**
 * Read-only security check of the two ORIGINAL Netlify production sites.
 * No credentials, no mutations and no new scheduler. Existing weekly
 * security-operations-proof workflow invokes this check after merge.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export const TARGETS=[
 {name:'Bedrijfsgeheugen',url:'https://www.bedrijfsgeheugen.nl/',mode:'business'},
 {name:'PW homepage (shared origin)',url:'https://pw-mo14-1.netlify.app/',mode:'legacy'},
 {name:'PW Zaalcoach',url:'https://pw-mo14-1.netlify.app/zaalplanner/',mode:'coach'},
 {name:'PW Veldcoach',url:'https://pw-mo14-1.netlify.app/veldplanner/',mode:'coach'}
];
export function evaluateHeaders(headers,mode){
 const get=n=>(headers.get(n)||'').trim(),missing=[];
 const csp=get('content-security-policy'),frame=get('x-frame-options').toLowerCase();
 if(get('x-content-type-options').toLowerCase()!=='nosniff')missing.push('X-Content-Type-Options');
 if(!/^max-age=\d+/.test(get('strict-transport-security')))missing.push('Strict-Transport-Security');
 if(!csp.includes("object-src 'none'"))missing.push('CSP object-src');
 if(!csp.includes('base-uri'))missing.push('CSP base-uri');
 if(mode==='coach'){
  if(!csp.includes("frame-ancestors 'none'"))missing.push('CSP frame-ancestors');
  const scripts=csp.match(/(?:^|;\s*)script-src\s+([^;]+)/)?.[1]||'';
  if(!scripts.includes("'self'")||!/'sha256-[A-Za-z0-9+/=]+'/.test(scripts)||scripts.includes("'unsafe-inline'")||scripts.includes("'unsafe-eval'"))missing.push('strict script hashes');
  if(frame!=='deny')missing.push('X-Frame-Options DENY');
  if(!get('cache-control').includes('no-store'))missing.push('private no-store cache');
  if(!csp.includes("form-action 'self'"))missing.push('form-action');
 }else if(mode==='legacy'){
  // The preserved PW homepage shares origin and browser storage with the youth
  // coach: no inline script, no off-site fetch, no cross-origin framing.
  const scripts=csp.match(/(?:^|;\s*)script-src\s+([^;]+)/)?.[1]||'';
  if(scripts.trim()!=="'self'"||!csp.includes("script-src-attr 'none'"))missing.push('legacy CSP script boundary');
  const connections=csp.match(/(?:^|;\s*)connect-src\s+([^;]+)/)?.[1]||'';
  if(connections.trim()!=="'self'")missing.push('legacy CSP outbound boundary');
  if(!csp.includes("frame-ancestors 'none'"))missing.push('legacy CSP frame-ancestors');
  if(frame!=='deny')missing.push('legacy X-Frame-Options DENY');
  if(!get('cache-control').includes('no-store'))missing.push('legacy no-store');
  if(!get('x-robots-tag').toLowerCase().includes('noindex'))missing.push('legacy noindex');
 }else{
  if(!csp.includes("frame-ancestors 'self'"))missing.push('CSP frame-ancestors');
  if(frame!=='sameorigin')missing.push('X-Frame-Options SAMEORIGIN');
 }
 return {passed:missing.length===0,missing};
}
export async function verifyTargets(targets=TARGETS,fetcher=fetch){
 const results=[];
 for(const target of targets){
  try{
   const resp=await fetcher(target.url,{method:'HEAD',redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(!resp.ok)throw Error('HTTP '+resp.status);
   const check=evaluateHeaders(resp.headers,target.mode);
   results.push({site:target.name,status:resp.status,...check});
  }catch(error){results.push({site:target.name,passed:false,missing:['request failure: '+String(error.message||error).slice(0,150)]});}
 }
 return results;
}
// Fail-closed read-only proof for two privileged Supabase endpoints.
// Calls are deliberately UNAUTHENTICATED; never send privileged API keys in a monitor.
export const PRIVILEGED_EDGE_TARGETS=[
 {name:'Master Control',url:'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-master-control'},
 {name:'Postgres Introspection',url:'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/db-pooler-introspect-v1'}
];
export async function verifyPrivilegedEdgeAuth(targets=PRIVILEGED_EDGE_TARGETS,fetcher=fetch){
 const results=[];
 for(const target of targets){
  const failures=[];
  for(const [method,expected] of [['GET',405],['POST',401]]){
   try{
    const response=await fetcher(target.url,{method,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000),...(method==='POST'?{headers:{'content-type':'application/json'},body:'{}'}:{})});
    if(response.status!==expected)failures.push(method+' returned HTTP '+response.status+' instead of '+expected);
    if(!(response.headers.get('cache-control')||'').includes('no-store'))failures.push(method+' missing no-store');
    if((response.headers.get('x-content-type-options')||'').toLowerCase()!=='nosniff')failures.push(method+' missing nosniff');
   }catch(error){failures.push(method+' request unavailable: '+String(error?.message||error).slice(0,100));}
  }
  results.push({site:target.name,passed:failures.length===0,missing:failures});
 }
 return results;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const r=[...await verifyTargets(),...await verifyPrivilegedEdgeAuth()];
 r.forEach(x=>console.log((x.passed?'PASS':'FAIL')+' '+x.site+(x.missing.length?' — '+x.missing.join(', '):'')));
 if(r.some(x=>!x.passed))process.exitCode=1;
}
