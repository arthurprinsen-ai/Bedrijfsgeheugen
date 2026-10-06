import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const required=(name)=>{
  const value=String(process.env[name]||'').trim();
  if(!value)throw new Error(name+'_REQUIRED');
  return value;
};

export function providerRows(payload){
  const rows=Array.isArray(payload)?payload:Array.isArray(payload?.functions)?payload.functions:null;
  if(!rows)throw new Error('SUPABASE_FUNCTION_LIST_SHAPE_INVALID');
  return rows;
}

export function readbacksForFunctions(payload,functions){
  const rows=providerRows(payload);
  return functions.map(fn=>{
    const matches=rows.filter(row=>String(row?.slug||'')===fn)
      .sort((a,b)=>Number(a?.updated_at||0)-Number(b?.updated_at||0));
    const row=matches.at(-1);
    if(!row)throw new Error('SUPABASE_PROVIDER_FUNCTION_METADATA_MISSING:'+fn);
    if(String(row.status||'')!=='ACTIVE')throw new Error('SUPABASE_PROVIDER_FUNCTION_NOT_ACTIVE:'+fn);
    const version=Number(row.version);
    const runtime_sha256=String(row.ezbr_sha256||'').toLowerCase();
    if(!Number.isInteger(version)||version<1)throw new Error('SUPABASE_PROVIDER_VERSION_INVALID:'+fn);
    if(!/^[0-9a-f]{64}$/.test(runtime_sha256))throw new Error('SUPABASE_PROVIDER_RUNTIME_SHA_INVALID:'+fn);
    return {function:fn,version,runtime_sha256,state:'ACTIVE'};
  });
}

export function mergeProviderLines(body,readbacks){
  const names=new Set(readbacks.map(row=>row.function));
  const lines=String(body||'').split(/\r?\n/).filter(line=>{
    const match=line.match(/^Terminal-Supabase-Provider-Readback:\s*function=([^;]+);/);
    return !match||!names.has(match[1]);
  });
  while(lines.length&&!lines.at(-1).trim())lines.pop();
  if(lines.length)lines.push('');
  for(const row of readbacks){
    lines.push(`Terminal-Supabase-Provider-Readback: function=${row.function};version=${row.version};runtime_sha256=${row.runtime_sha256}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function jsonFetch(url,options={}){
  const response=await fetch(url,options);
  const body=await response.text();
  if(!response.ok)throw new Error(`HTTP_${response.status}:${url}:${body.slice(0,300)}`);
  return body?JSON.parse(body):null;
}

export async function publishProviderReadback({
  projectRef,accessToken,githubToken,repository,sha,functions
}){
  const payload=await jsonFetch(`https://api.supabase.com/v1/projects/${projectRef}/functions`,{
    headers:{authorization:`Bearer ${accessToken}`}
  });
  const readbacks=readbacksForFunctions(payload,functions);

  const pulls=await jsonFetch(`https://api.github.com/repos/${repository}/commits/${sha}/pulls`,{
    headers:{
      authorization:`Bearer ${githubToken}`,
      accept:'application/vnd.github+json',
      'x-github-api-version':'2022-11-28'
    }
  });
  const merged=(Array.isArray(pulls)?pulls:[]).filter(pr=>pr?.merged_at)
    .sort((a,b)=>Date.parse(a.merged_at)-Date.parse(b.merged_at));
  const pr=merged.at(-1)||null;
  if(!pr)return {readbacks,pr_number:null,writeback:false};

  const current=await jsonFetch(`https://api.github.com/repos/${repository}/pulls/${pr.number}`,{
    headers:{
      authorization:`Bearer ${githubToken}`,
      accept:'application/vnd.github+json',
      'x-github-api-version':'2022-11-28'
    }
  });
  const next=mergeProviderLines(current?.body||'',readbacks);
  if(next!==String(current?.body||'')){
    await jsonFetch(`https://api.github.com/repos/${repository}/pulls/${pr.number}`,{
      method:'PATCH',
      headers:{
        authorization:`Bearer ${githubToken}`,
        accept:'application/vnd.github+json',
        'content-type':'application/json',
        'x-github-api-version':'2022-11-28'
      },
      body:JSON.stringify({body:next})
    });
  }
  return {readbacks,pr_number:pr.number,writeback:true};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const functions=readFileSync('/tmp/functions.txt','utf8').split(/\r?\n/).filter(Boolean);
  const result=await publishProviderReadback({
    projectRef:required('PROJECT_REF'),
    accessToken:required('SUPABASE_ACCESS_TOKEN'),
    githubToken:required('GITHUB_TOKEN'),
    repository:required('GITHUB_REPOSITORY'),
    sha:required('GITHUB_SHA'),
    functions
  });
  mkdirSync('.artifacts/supabase-edge-production-readback',{recursive:true});
  writeFileSync(
    '.artifacts/supabase-edge-production-readback/provider-manifest.json',
    JSON.stringify(result,null,2)+'\n'
  );
  writeFileSync(
    '.artifacts/supabase-edge-production-readback/provider-readbacks.txt',
    result.readbacks.map(row=>`Terminal-Supabase-Provider-Readback: function=${row.function};version=${row.version};runtime_sha256=${row.runtime_sha256}`).join('\n')+'\n'
  );
  process.stdout.write(`SUPABASE_PROVIDER_PR_WRITEBACK_PROVEN:pr=${result.pr_number||'NONE'} functions=${functions.join(',')}\n`);
}
