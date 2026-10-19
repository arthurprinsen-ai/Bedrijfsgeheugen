// Read one approved provider key inside a trusted GitHub Actions runner only.
// No key is committed, printed in logs, or exposed to public/anonymous callers.
import {appendFile} from 'node:fs/promises';
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

export async function loadOpenAIKeyForRunner({
  envPath=process.env.GITHUB_ENV,
  maskWriter=value=>process.stdout.write('::add-mask::'+value+'\n'),
  appendFileImpl=appendFile,
  ...options
}={}) {
  if (!ensureString(envPath)) throw new Error('OPENAI_VAULT_GITHUB_ENV_MISSING');
  const key=await resolveOpenAIKeyFromVault(options);
  // GitHub's add-mask workflow command is processed by the Actions runner;
  // it MUST precede writing the ephemeral job environment file.
  maskWriter(key);
  await appendFileImpl(envPath,'OPENAI_API_KEY='+key+'\n',{encoding:'utf8',mode:0o600});
  return {contract:CONTRACT,ready:true};
}

async function main() {
  await loadOpenAIKeyForRunner();
  console.log('BLOG_OPENAI_VAULT_CREDENTIAL_READY');
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  main().catch(error=>{
    // These are fixed internal error classes only, never remote response bodies.
    const code=String(error?.message||'OPENAI_VAULT_UNKNOWN_FAILURE');
    console.error(/^OPENAI_VAULT_[A-Z_]+$/.test(code)?code:'OPENAI_VAULT_UNKNOWN_FAILURE');
    process.exitCode=1;
  });
}
