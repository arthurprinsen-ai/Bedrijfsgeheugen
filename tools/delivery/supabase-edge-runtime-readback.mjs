import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const SUPABASE_EDGE_RUNTIME_READBACK_CONTRACT='powerhouse-supabase-edge-runtime-readback-v1';
export const RUNTIME_FINGERPRINT_PLACEHOLDER='__POWERHOUSE_RUNTIME_FINGERPRINT__';
const DECLARATION_RE=/const RUNTIME_READBACK_FINGERPRINT\s*=\s*['"]([^'"]+)['"];/;

export function normalizeRuntimeSourceForFingerprint(source=''){
  const text=String(source);
  if(!DECLARATION_RE.test(text)) throw new Error('RUNTIME_READBACK_FINGERPRINT_DECLARATION_MISSING');
  return text.replace(DECLARATION_RE,`const RUNTIME_READBACK_FINGERPRINT='${RUNTIME_FINGERPRINT_PLACEHOLDER}';`);
}

export function computeRuntimeSourceFingerprint(source=''){
  return crypto.createHash('sha256').update(normalizeRuntimeSourceForFingerprint(source)).digest('hex');
}

export function declaredRuntimeSourceFingerprint(source=''){
  const match=String(source).match(DECLARATION_RE);
  return match ? String(match[1]).trim().toLowerCase() : '';
}

export function validateRuntimeSource({source='',slug=''}={}){
  const declared=declaredRuntimeSourceFingerprint(source);
  const expected=computeRuntimeSourceFingerprint(source);
  if(!/^[0-9a-f]{64}$/.test(declared)) throw new Error(`RUNTIME_READBACK_FINGERPRINT_INVALID:${slug}`);
  if(declared!==expected) throw new Error(`RUNTIME_READBACK_FINGERPRINT_STALE:${slug}:${declared}:${expected}`);
  if(!String(source).includes("mode') === 'runtime_readback'")) throw new Error(`RUNTIME_READBACK_PROBE_MISSING:${slug}`);
  if(!String(source).includes('DENO_DEPLOYMENT_ID')) throw new Error(`RUNTIME_READBACK_DEPLOYMENT_ID_MISSING:${slug}`);
  return {slug,source_fingerprint:expected};
}

export function changedEdgeFunctionSlugs(paths=[]){
  const slugs=new Set();
  for(const value of paths){
    const clean=String(value??'').trim().replace(/^\.\//,'');
    const match=clean.match(/^supabase\/functions\/([^/]+)\//);
    if(!match) continue;
    if(match[1].startsWith('_')) throw new Error('SUPABASE_SHARED_RUNTIME_PATH_REQUIRES_EXPLICIT_FUNCTION_SET:'+clean);
    slugs.add(match[1]);
  }
  return [...slugs].sort();
}

async function fetchProbe(url,{maxAttempts=6,timeoutMs=10000}={}){
  let last='';
  for(let attempt=1;attempt<=maxAttempts;attempt+=1){
    try{
      const response=await fetch(url,{
        method:'GET',
        headers:{'cache-control':'no-cache','pragma':'no-cache','accept':'application/json'},
        signal:AbortSignal.timeout(timeoutMs),
      });
      const bodyText=await response.text();
      if(!response.ok) throw new Error(`HTTP_${response.status}:${bodyText.slice(0,300)}`);
      return JSON.parse(bodyText);
    }catch(error){
      last=String(error?.message||error);
      if(attempt<maxAttempts) await new Promise(resolve=>setTimeout(resolve,attempt*1000));
    }
  }
  throw new Error('SUPABASE_RUNTIME_PROBE_UNAVAILABLE:'+last);
}

export async function verifySupabaseEdgeRuntime({
  paths=[],
  rootDir=process.cwd(),
  contractPath='brain/contracts/supabase-edge-runtime-readback-v1.json',
}={}){
  const contract=JSON.parse(fs.readFileSync(path.resolve(rootDir,contractPath),'utf8'));
  if(contract.id!==SUPABASE_EDGE_RUNTIME_READBACK_CONTRACT) throw new Error('SUPABASE_RUNTIME_CONTRACT_ID_INVALID');
  const projectRef=String(contract.project_ref||'').trim();
  if(!/^[a-z0-9]{20}$/.test(projectRef)) throw new Error('SUPABASE_PROJECT_REF_INVALID');
  const slugs=changedEdgeFunctionSlugs(paths);
  const results=[];
  for(const slug of slugs){
    const relative=`supabase/functions/${slug}/index.ts`;
    const absolute=path.resolve(rootDir,relative);
    if(!fs.existsSync(absolute)) throw new Error('SUPABASE_EDGE_ENTRYPOINT_MISSING:'+relative);
    const source=fs.readFileSync(absolute,'utf8');
    const sourceContract=validateRuntimeSource({source,slug});
    const url=`https://${projectRef}.supabase.co/functions/v1/${slug}?mode=runtime_readback`;
    const body=await fetchProbe(url,{maxAttempts:Number(contract.max_attempts||6),timeoutMs:Number(contract.timeout_ms||10000)});
    if(body?.ok!==true) throw new Error('SUPABASE_RUNTIME_PROBE_NOT_OK:'+slug);
    if(body?.contract!==SUPABASE_EDGE_RUNTIME_READBACK_CONTRACT) throw new Error('SUPABASE_RUNTIME_PROBE_CONTRACT_MISMATCH:'+slug);
    if(body?.function!==slug) throw new Error('SUPABASE_RUNTIME_PROBE_FUNCTION_MISMATCH:'+slug);
    if(String(body?.source_fingerprint||'').toLowerCase()!==sourceContract.source_fingerprint) throw new Error('SUPABASE_RUNTIME_SOURCE_MISMATCH:'+slug);
    const deploymentId=String(body?.deployment_id||'');
    if(!new RegExp('^'+projectRef+'_[^_]+_\\d+$').test(deploymentId)) throw new Error('SUPABASE_RUNTIME_DEPLOYMENT_ID_INVALID:'+slug);
    results.push({
      function:slug,
      source_path:relative,
      source_fingerprint:sourceContract.source_fingerprint,
      deployment_id:deploymentId,
      region:body?.region||null,
      probe_url:url,
    });
  }
  return {
    contract:SUPABASE_EDGE_RUNTIME_READBACK_CONTRACT,
    project_ref:projectRef,
    status:slugs.length?'LIVE_VERIFIED':'NOT_APPLICABLE',
    functions:results,
    verified_count:results.length,
    observed_at:new Date().toISOString(),
  };
}

function arg(name){
  const index=process.argv.indexOf(name);
  return index>=0 ? process.argv[index+1] : '';
}

const isCli=process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isCli){
  try{
    const command=process.argv[2];
    if(command!=='verify') throw new Error('USAGE: supabase-edge-runtime-readback.mjs verify --paths-file <file> [--output <file>]');
    const pathsFile=arg('--paths-file');
    if(!pathsFile) throw new Error('PATHS_FILE_REQUIRED');
    const paths=fs.readFileSync(pathsFile,'utf8').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const evidence=await verifySupabaseEdgeRuntime({paths});
    const output=arg('--output');
    if(output){
      fs.mkdirSync(path.dirname(output),{recursive:true});
      fs.writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');
    }
    process.stdout.write(JSON.stringify(evidence,null,2)+'\n');
  }catch(error){
    process.stderr.write(`SUPABASE_EDGE_RUNTIME_READBACK_FAILED: ${error?.message||error}\n`);
    process.exitCode=1;
  }
}
