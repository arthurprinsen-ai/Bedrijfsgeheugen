// Read one approved provider key inside a trusted GitHub Actions runner only.
// No key is committed, written to files, printed, or exposed to public/anonymous callers.
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const PROJECT_URL='https://adhjwmvyoixzjtmiroln.supabase.co';
const CONTRACT='BLOG_OPENAI_VAULT_RUNNER_V1';
const SECRET_NAME='OPENAI_API_KEY';

function ensureString(value) {
  return typeof value==='string' ? value.trim() : '';
}
function assertSafeKey(key) {
  if (!/^sk-[A-Za-z0-9_-]{18,}$/.test(key) || key.includes('\n') || key.includes('\r')) {
    throw new Error('OPENAI_VAULT_SECRET_INVALID');
  }
}

export async function resolveOpenAIKeyFromVault({
  supabaseUrl=process.env.SUPABASE_URL,
  serviceRoleKey=process.env.SUPABASE_SERVICE_ROLE_KEY,
  fetchImpl=fetch,
}={}) {
  const url=ensureString(supabaseUrl).replace(/\/$/,'');
  const credential=ensureString(serviceRoleKey);
  // Pin both hostname and protocol; an accidentally changed runner variable
  // must never be able to redirect the privileged token to another host.
  if (url!==PROJECT_URL) throw new Error('OPENAI_VAULT_PROJECT_URL_INVALID');
  if (!credential || /[\r\n]/.test(credential)) throw new Error('OPENAI_VAULT_SERVICE_CREDENTIAL_MISSING');
  let response;
  try {
    response=await fetchImpl(url+'/rest/v1/rpc/bg_geheim',{
      method:'POST',
      headers:{
        apikey:credential,
        authorization:'Bearer '+credential,
        'content-type':'application/json',
        accept:'application/json',
      },
      body:JSON.stringify({p_naam:SECRET_NAME}),
      signal:AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error('OPENAI_VAULT_RPC_UNAVAILABLE');
  }
  if (!response?.ok) {
    const status=Number(response?.status)||0;
    throw new Error([401,403].includes(status) ?
      'OPENAI_VAULT_RPC_UNAUTHORIZED' : 'OPENAI_VAULT_RPC_FAILED');
  }
  let value;
  try { value=await response.json(); } catch {
    throw new Error('OPENAI_VAULT_RESPONSE_INVALID');
  }
  // A scalar text-returning PostgREST RPC returns a JSON string.
  // Reject all objects/arrays so no unvetted field can become a credential.
  if (typeof value!=='string') throw new Error('OPENAI_VAULT_RESPONSE_INVALID');
  assertSafeKey(value);
  return value;
}


const ALLOWED_COMMANDS=new Set([
  'tools/content-growth/openai-approved-blog.mjs',
  'tools/ci/netlify-build-entry.mjs',
]);

// Run the approved producer in a single process lifetime. Vault material NEVER
// goes through a GitHub environment file, output, artifact, or source repository.
export async function runWithVaultOpenAIKey({
  argv=process.argv.slice(2),
  spawnImpl=spawnSync,
  ...options
}={}) {
  const [runtime,target,...args]=argv;
  if (runtime!=='node' || !ALLOWED_COMMANDS.has(target) ||
      (target==='tools/content-growth/openai-approved-blog.mjs' && args.length!==0) ||
      (target==='tools/ci/netlify-build-entry.mjs' &&
        (args.length!==1 || !/^--prepare-i18n-cache=powerhouse-blog-\\d{4}-\\d{2}-\\d{2}\\.json$/.test(args[0])))) {
    throw new Error('OPENAI_VAULT_COMMAND_NOT_ALLOWED');
  }
  const key=await resolveOpenAIKeyFromVault(options);
  const env={...process.env,OPENAI_API_KEY:key};
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  delete env.SUPABASE_URL;
  // No shell and no secret on argv. Child receives key in its private env
  // only; a failing child cannot mark a blog published.
  const result=spawnImpl(process.execPath,[target,...args],{
    env,stdio:'inherit',shell:false,cwd:process.cwd(),
  });
  if (result?.error || !Number.isInteger(result?.status)) {
    throw new Error('OPENAI_VAULT_CHILD_EXECUTION_FAILED');
  }
  return {contract:CONTRACT,status:result.status};
}

async function main() {
  const result=await runWithVaultOpenAIKey();
  console.log('BLOG_OPENAI_VAULT_RUN',result.status===0?'PASSED':'FAILED');
  if(result.status!==0) process.exitCode=result.status;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  main().catch(error=>{
    // These are fixed internal error classes only, never remote response bodies.
    const code=String(error?.message||'OPENAI_VAULT_UNKNOWN_FAILURE');
    console.error(/^OPENAI_VAULT_[A-Z_]+$/.test(code)?code:'OPENAI_VAULT_UNKNOWN_FAILURE');
    process.exitCode=1;
  });
}
