import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const required=(name)=>{
  const value=String(process.env[name]||'').trim();
  if(!value) throw new Error(name+'_REQUIRED');
  return value;
};

export function parseMigrationPath(path){
  const match=String(path||'').match(/^supabase\/migrations\/([0-9]{14})_([A-Za-z0-9_]+)\.sql$/);
  if(!match) throw new Error('SUPABASE_MIGRATION_PATH_INVALID:'+path);
  return {path:String(path),version:match[1],name:match[2]};
}

export function migrationRows(payload){
  if(Array.isArray(payload)) return payload;
  if(Array.isArray(payload?.migrations)) return payload.migrations;
  if(Array.isArray(payload?.data)) return payload.data;
  throw new Error('SUPABASE_MIGRATION_HISTORY_SHAPE_INVALID');
}

export function readbacksForMigrationPaths(payload,migrationPaths,{projectRef,observedAt}){
  const rows=migrationRows(payload);
  return migrationPaths.map(path=>{
    const migration=parseMigrationPath(path);
    const row=rows.find(item=>String(item?.version||'')===migration.version && String(item?.name||'')===migration.name);
    if(!row) throw new Error('SUPABASE_MIGRATION_PROVIDER_HISTORY_MISSING:'+migration.version+':'+migration.name);
    return {
      ...migration,
      state:'APPLIED',
      project:projectRef,
      observed_at:observedAt
    };
  });
}

export function mergeMigrationLines(body,readbacks){
  const keys=new Set(readbacks.map(row=>row.version+':'+row.name));
  const lines=String(body||'').split(/\r?\n/).filter(line=>{
    const match=line.match(/^Terminal-Supabase-Migration-Readback:\s*version=([^;]+);name=([^;]+);/);
    return !match || !keys.has(match[1]+':'+match[2]);
  });
  while(lines.length&&!lines.at(-1).trim()) lines.pop();
  if(lines.length) lines.push('');
  for(const row of readbacks){
    lines.push(`Terminal-Supabase-Migration-Readback: version=${row.version};name=${row.name};state=APPLIED;project=${row.project};observed_at=${row.observed_at}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function jsonFetch(url,options={}){
  const response=await fetch(url,options);
  const body=await response.text();
  if(!response.ok) throw new Error(`HTTP_${response.status}:${url}:${body.slice(0,300)}`);
  return body?JSON.parse(body):null;
}

const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

export async function observeMigrationReadbacks({
  projectRef,accessToken,migrationPaths,attempts=24,delayMs=5000
}){
  let lastError=null;
  for(let attempt=1;attempt<=attempts;attempt++){
    const payload=await jsonFetch(`https://api.supabase.com/v1/projects/${projectRef}/database/migrations`,{
      headers:{authorization:`Bearer ${accessToken}`}
    });
    const observedAt=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
    try{
      return {
        attempt,
        readbacks:readbacksForMigrationPaths(payload,migrationPaths,{projectRef,observedAt})
      };
    }catch(error){
      if(!String(error?.message||error).startsWith('SUPABASE_MIGRATION_PROVIDER_HISTORY_MISSING:')) throw error;
      lastError=error;
    }
    if(attempt<attempts) await sleep(delayMs);
  }
  throw lastError||new Error('SUPABASE_MIGRATION_PROVIDER_READBACK_TIMEOUT');
}

async function resolveMergedPullRequest({githubToken,repository,sha,targetPrNumber=null}){
  const headers={
    authorization:`Bearer ${githubToken}`,
    accept:'application/vnd.github+json',
    'x-github-api-version':'2022-11-28'
  };
  if(targetPrNumber){
    const explicit=await jsonFetch(`https://api.github.com/repos/${repository}/pulls/${targetPrNumber}`,{headers});
    if(!explicit?.merged_at) throw new Error('SUPABASE_MIGRATION_TARGET_PR_NOT_MERGED:'+targetPrNumber);
    return explicit;
  }
  const pulls=await jsonFetch(`https://api.github.com/repos/${repository}/commits/${sha}/pulls`,{headers});
  const merged=(Array.isArray(pulls)?pulls:[]).filter(pr=>pr?.merged_at)
    .sort((a,b)=>Date.parse(a.merged_at)-Date.parse(b.merged_at));
  return merged.at(-1)||null;
}

export async function publishMigrationReadback({
  projectRef,accessToken,githubToken,repository,sha,migrationPaths,targetPrNumber=null
}){
  const {attempt,readbacks}=await observeMigrationReadbacks({projectRef,accessToken,migrationPaths});
  const pr=await resolveMergedPullRequest({githubToken,repository,sha,targetPrNumber});
  if(!pr) throw new Error('SUPABASE_MIGRATION_TARGET_PR_MISSING:'+sha);

  const headers={
    authorization:`Bearer ${githubToken}`,
    accept:'application/vnd.github+json',
    'content-type':'application/json',
    'x-github-api-version':'2022-11-28'
  };
  const current=await jsonFetch(`https://api.github.com/repos/${repository}/pulls/${pr.number}`,{headers});
  const next=mergeMigrationLines(current?.body||'',readbacks);
  if(next!==String(current?.body||'')){
    await jsonFetch(`https://api.github.com/repos/${repository}/pulls/${pr.number}`,{
      method:'PATCH',headers,body:JSON.stringify({body:next})
    });
  }
  return {attempt,readbacks,pr_number:pr.number,writeback:true};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const migrationPaths=readFileSync('/tmp/migrations.txt','utf8').split(/\r?\n/).filter(Boolean);
  if(!migrationPaths.length) throw new Error('SUPABASE_MIGRATION_PATHS_REQUIRED');
  const result=await publishMigrationReadback({
    projectRef:required('PROJECT_REF'),
    accessToken:required('SUPABASE_ACCESS_TOKEN'),
    githubToken:required('GITHUB_TOKEN'),
    repository:required('GITHUB_REPOSITORY'),
    sha:required('GITHUB_SHA'),
    migrationPaths,
    targetPrNumber:String(process.env.TARGET_PR_NUMBER||'').trim()||null
  });
  mkdirSync('.artifacts/supabase-edge-production-readback',{recursive:true});
  writeFileSync('.artifacts/supabase-edge-production-readback/migration-provider-readbacks.json',JSON.stringify({
    contract:'supabase-migration-provider-readback-v1',
    project_ref:required('PROJECT_REF'),
    protected_main_sha:required('GITHUB_SHA'),
    provider_observation_attempt:result.attempt,
    pr_number:result.pr_number,
    migrations:result.readbacks
  },null,2)+'\n');
  process.stdout.write(`SUPABASE_MIGRATION_PROVIDER_PR_WRITEBACK_PROVEN:pr=${result.pr_number} migrations=${migrationPaths.join(',')} attempt=${result.attempt}\n`);
}
