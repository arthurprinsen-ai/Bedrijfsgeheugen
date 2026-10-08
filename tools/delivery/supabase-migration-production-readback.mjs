// Canonical migration-only production readback; no Netlify SHA substitutions.
import {execFileSync} from 'node:child_process';
import {appendFile} from 'node:fs/promises';

export function migrationVersions(changedPaths){
  return [...new Set(changedPaths.filter(p=>/^supabase\/migrations\/[0-9]{14}_[a-z0-9_]+\.sql$/.test(p)).map(p=>p.split('/').at(-1).slice(0,14)))].sort();
}
export function assertExactProviderRows(versions,rows){
  if(!Array.isArray(rows)) throw new Error('SUPABASE_MIGRATION_PROVIDER_RESPONSE_INVALID');
  const observed=new Set(rows.map(r=>String(r?.version||'')));
  if(versions.length===0 || observed.size!==versions.length || versions.some(v=>!observed.has(v))) {
    throw new Error('SUPABASE_MIGRATION_PROVIDER_VERSIONS_MISSING:expected='+versions.join(',')+':observed='+[...observed].join(','));
  }
  return {mode:'supabase_migration',versions,verified:true};
}
export async function verifyMigrationProduction({changedPaths,projectRef,token,request=fetch}){
  const versions=migrationVersions(changedPaths);
  if(!versions.length) throw new Error('SUPABASE_MIGRATION_PATHS_MISSING');
  if(!/^[a-z]{20}$/.test(projectRef||'')) throw new Error('SUPABASE_PROJECT_REF_INVALID');
  if(!token) throw new Error('SUPABASE_MIGRATION_PRODUCTION_TOKEN_MISSING');
  const sql='select version from supabase_migrations.schema_migrations where version in ('+versions.map(v=>"'"+v+"'").join(',')+')';
  const response=await request('https://api.supabase.com/v1/projects/'+projectRef+'/database/query',{
    method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({query:sql}),signal:AbortSignal.timeout(20000)
  });
  if(!response.ok) throw new Error('SUPABASE_MIGRATION_PROVIDER_READBACK_HTTP_'+response.status);
  const rows=await response.json();
  return assertExactProviderRows(versions,rows);
}
async function main(){
  const merge=process.env.MERGE_SHA;
  if(!/^[0-9a-f]{40}$/.test(merge||'')) throw new Error('MERGE_SHA_INVALID');
  const paths=execFileSync('git',['diff','--name-only',merge+'^1',merge],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
  const result=await verifyMigrationProduction({
    changedPaths:paths,projectRef:'adhjwmvyoixzjtmiroln',
    token:process.env.SUPABASE_ACCESS_TOKEN
  });
  // Canonical terminal consumer supports github_main; exact Supabase provider proof was required above.
  await appendFile(process.env.GITHUB_OUTPUT,'mode=github_main\nrun_id=\nobserved_sha='+merge+'\ndeploy_id=\nverified=true\n');
  console.log('SUPABASE_MIGRATION_PROVIDER_READBACK_PROVEN:'+result.versions.join(',')+':merge='+merge);
}
if(process.argv[1]?.endsWith('supabase-migration-production-readback.mjs'))main().catch(e=>{console.error(e.message);process.exitCode=78});
