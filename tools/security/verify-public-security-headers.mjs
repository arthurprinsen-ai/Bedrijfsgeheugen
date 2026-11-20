/**
 * Read-only security check of the two ORIGINAL Netlify production sites.
 * No credentials, no mutations and no new scheduler. Existing weekly
 * security-operations-proof workflow invokes this check after merge.
 */
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export const TARGETS=[
 {name:'Bedrijfsgeheugen',url:'https://www.bedrijfsgeheugen.nl/',mode:'business'},
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
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const r=await verifyTargets();
 r.forEach(x=>console.log((x.passed?'PASS':'FAIL')+' '+x.site+(x.missing.length?' — '+x.missing.join(', '):'')));
 if(r.some(x=>!x.passed))process.exitCode=1;
}
