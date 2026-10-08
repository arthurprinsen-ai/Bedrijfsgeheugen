import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FUNCTION_SECTION=/^\[functions\.([a-z0-9][a-z0-9-]*)\]$/;

export function declaredFunctions(configText){
  return [...new Set(String(configText||'').split(/\r?\n/)
    .map(line=>line.trim().match(FUNCTION_SECTION)?.[1]||'')
    .filter(Boolean))].sort();
}

function functionSections(configText){
  const sections=new Map();
  let current='';
  for(const raw of String(configText||'').split(/\r?\n/)){
    const line=raw.trim();
    const match=line.match(FUNCTION_SECTION);
    if(match){
      current=match[1];
      if(!sections.has(current))sections.set(current,[]);
      continue;
    }
    if(current)sections.get(current).push(raw);
  }
  return new Map([...sections].map(([name,lines])=>[
    name,
    lines.map(line=>line.trim()).filter(Boolean).join('\n')
  ]));
}

function nonFunctionConfig(configText){
  const out=[];
  let inFunction=false;
  for(const raw of String(configText||'').split(/\r?\n/)){
    const line=raw.trim();
    if(FUNCTION_SECTION.test(line)){
      inFunction=true;
      continue;
    }
    if(/^\[/.test(line))inFunction=false;
    if(!inFunction)out.push(raw);
  }
  return out.map(line=>line.trim()).filter(Boolean).join('\n');
}

export function resolveEdgeRuntimeFunctions({changedPaths=[],configText='',baseConfigText=null}={}){
  const paths=[...new Set((changedPaths||[]).map(x=>String(x||'').trim()).filter(Boolean))].sort();
  const declared=declaredFunctions(configText);
  if(paths.some(path=>path.startsWith('supabase/functions/_shared/')))return declared;

  const direct=new Set();
  for(const path of paths){
    const match=path.match(/^supabase\/functions\/([^/]+)\//);
    if(!match)continue;
    const slug=match[1];
    if(slug.startsWith('_'))continue;
    direct.add(slug);
  }

  if(paths.includes('supabase/config.toml')){
    if(typeof baseConfigText!=='string' || !baseConfigText.trim())return declared;
    if(nonFunctionConfig(baseConfigText)!==nonFunctionConfig(configText))return declared;

    const before=functionSections(baseConfigText);
    const after=functionSections(configText);
    const removed=[...before.keys()].filter(name=>!after.has(name));
    if(removed.length)return declared;

    for(const name of after.keys()){
      if(!before.has(name) || before.get(name)!==after.get(name))direct.add(name);
    }
  }

  // Directly edited functions must never disappear from the required provider set.
  // Undeclared functions are rejected by the production authority rather than
  // silently being reported as NOT_APPLICABLE.
  return [...direct].sort();
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const changedFile=process.argv[2];
  if(!changedFile)throw new Error('CHANGED_PATHS_FILE_REQUIRED');
  const changedPaths=readFileSync(changedFile,'utf8').split(/\r?\n/).filter(Boolean);
  const configText=readFileSync('supabase/config.toml','utf8');
  let baseConfigText=null;
  if(changedPaths.includes('supabase/config.toml')){
    try{
      const baseRef=process.env.POWERHOUSE_BASE_SHA||'HEAD^';
      baseConfigText=execFileSync('git',['show',`${baseRef}:supabase/config.toml`],{encoding:'utf8'});
    }catch{}
  }
  const resolved=resolveEdgeRuntimeFunctions({changedPaths,configText,baseConfigText});
  process.stdout.write(resolved.join('\n'));
  if(resolved.length)process.stdout.write('\n');
}
