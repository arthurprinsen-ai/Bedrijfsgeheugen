// Canonical migration-only production readback; no Netlify SHA substitutions.
// A migration number is not enough: provider version AND name must match Git.
// After the first terminal-proof migration, every subsequent migration-only
// production closure must also verify the SAME active original BRAIN guard.
import {execFileSync} from 'node:child_process';
import {appendFile} from 'node:fs/promises';

const MIGRATION_PATH=/^supabase\/migrations\/([0-9]{14})_([a-z0-9_]+)\.sql$/;
const TERMINAL_GUARD_FIRST_VERSION='20261113083000';

export function migrationIdentities(changedPaths){
  const identities=new Map();
  for(const path of changedPaths){
    const match=String(path||'').match(MIGRATION_PATH);
    if(!match) continue;
    const [,version,name]=match;
    if(identities.has(version) && identities.get(version).name!==name)
      throw new Error('SUPABASE_MIGRATION_VERSION_COLLISION:'+version);
    identities.set(version,{version,name});
  }
  return [...identities.values()].sort((a,b)=>a.version.localeCompare(b.version));
}

export function migrationVersions(changedPaths){
  return migrationIdentities(changedPaths).map(row=>row.version);
}

// Retained for existing historical callers; new terminal verification uses
// assertExactProviderIdentities and NEVER trusts version alone.
export function assertExactProviderRows(versions,rows){
  if(!Array.isArray(rows)) throw new Error('SUPABASE_MIGRATION_PROVIDER_RESPONSE_INVALID');
  const observed=new Set(rows.map(r=>String(r?.version||'')));
  if(versions.length===0 || observed.size!==versions.length || versions.some(v=>!observed.has(v))) {
    throw new Error('SUPABASE_MIGRATION_PROVIDER_VERSIONS_MISSING:expected='+versions.join(',')+':observed='+[...observed].join(','));
  }
  return {mode:'supabase_migration',versions,verified:true};
}

export function assertExactProviderIdentities(identities,rows){
  if(!Array.isArray(rows)) throw new Error('SUPABASE_MIGRATION_PROVIDER_RESPONSE_INVALID');
  const expected=new Map(identities.map(r=>[r.version,r.name]));
  const observed=new Map();
  for(const row of rows){
    const version=String(row?.version||'');
    const name=String(row?.name||'');
    if(observed.has(version)) throw new Error('SUPABASE_MIGRATION_PROVIDER_DUPLICATE_VERSION:'+version);
    observed.set(version,name);
  }
  if(!identities.length || observed.size!==expected.size ||
      [...expected].some(([version,name])=>observed.get(version)!==name)) {
    throw new Error('SUPABASE_MIGRATION_PROVIDER_EXACT_IDENTITY_MISSING:expected='+
      [...expected].map(([v,n])=>v+':'+n).join(',')+
      ':observed='+[...observed].map(([v,n])=>v+':'+n).join(','));
  }
  return {mode:'supabase_migration',versions:[...expected.keys()],verified:true,exact_names_verified:true};
}

// The old SQL version receipt cannot establish that an actual trigger is
// installed, enabled, invoker-only and inaccessible to untrusted API roles.
// This query is read-only and executed via the ORIGINAL provider readback API.
export const terminalGuardProofSql=`SELECT EXISTS (
  SELECT 1 FROM pg_trigger t
  JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_proc f ON f.oid=t.tgfoid
  JOIN pg_namespace fn ON fn.oid=f.pronamespace
  WHERE n.nspname='public' AND c.relname='brain_obligations'
    AND t.tgname='brain_content_handoff_terminal_proof_guard_v1'
    AND NOT t.tgisinternal AND t.tgenabled='O'
    AND fn.nspname='public' AND f.proname='brain_guard_content_terminal_proof_v1'
    AND f.prosecdef=false
    AND NOT has_function_privilege('anon',f.oid,'EXECUTE')
    AND NOT has_function_privilege('authenticated',f.oid,'EXECUTE')
    AND position('CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED' in pg_get_functiondef(f.oid))>0
    AND position('CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED' in pg_get_functiondef(f.oid))>0
    AND position('CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED' in pg_get_functiondef(f.oid))>0
) AS guard_proven`;

export function assertCanonicalTerminalGuardProof(rows){
  if(!Array.isArray(rows) || rows.length!==1 || rows[0]?.guard_proven!==true)
    throw new Error('SUPABASE_ONE_CHAIN_TERMINAL_GUARD_NOT_ACTIVE');
  return {guard_proven:true};
}

export async function verifyMigrationProduction({changedPaths,projectRef,token,request=fetch}){
  const identities=migrationIdentities(changedPaths);
  if(!identities.length) throw new Error('SUPABASE_MIGRATION_PATHS_MISSING');
  if(!/^[a-z]{20}$/.test(projectRef||'')) throw new Error('SUPABASE_PROJECT_REF_INVALID');
  if(!token) throw new Error('SUPABASE_MIGRATION_PRODUCTION_TOKEN_MISSING');

  const providerQuery=async sql=>{
    const response=await request('https://api.supabase.com/v1/projects/'+projectRef+'/database/query',{
      method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({query:sql}),signal:AbortSignal.timeout(20000)
    });
    if(!response.ok) throw new Error('SUPABASE_MIGRATION_PROVIDER_READBACK_HTTP_'+response.status);
    return response.json();
  };

  const sql='select version,name from supabase_migrations.schema_migrations where version in ('+
      identities.map(row=>"'"+row.version+"'").join(',')+')';
  const result=assertExactProviderIdentities(identities,await providerQuery(sql));
  if(identities.some(row=>row.version>=TERMINAL_GUARD_FIRST_VERSION)){
    assertCanonicalTerminalGuardProof(await providerQuery(terminalGuardProofSql));
    result.guard_proven=true;
  }
  return result;
}

async function main(){
  const merge=process.env.MERGE_SHA;
  if(!/^[0-9a-f]{40}$/.test(merge||'')) throw new Error('MERGE_SHA_INVALID');
  const paths=execFileSync('git',['diff','--name-only',merge+'^1',merge],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
  const result=await verifyMigrationProduction({
    changedPaths:paths,projectRef:'adhjwmvyoixzjtmiroln',
    token:process.env.SUPABASE_ACCESS_TOKEN
  });
  // The original terminal control plane owns the write/ACK after this proof.
  await appendFile(process.env.GITHUB_OUTPUT,'mode=github_main\nrun_id=\nobserved_sha='+merge+'\ndeploy_id=\nverified=true\n');
  console.log('SUPABASE_MIGRATION_PROVIDER_READBACK_PROVEN:'+result.versions.join(',')+
    ':exact_names=true:terminal_guard='+String(result.guard_proven===true)+':merge='+merge);
}
if(process.argv[1]?.endsWith('supabase-migration-production-readback.mjs'))main().catch(e=>{console.error(e.message);process.exitCode=78});
