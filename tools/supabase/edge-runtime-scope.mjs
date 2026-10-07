import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FUNCTION_SECTION=/^\[functions\.([a-z0-9][a-z0-9-]*)\]$/;

export function declaredFunctions(configText){
  return [...new Set(String(configText||'').split(/\r?\n/)
    .map(line=>line.trim().match(FUNCTION_SECTION)?.[1]||'')
    .filter(Boolean))].sort();
}

export function resolveEdgeRuntimeFunctions({changedPaths=[],configText='' }={}){
  const paths=[...new Set((changedPaths||[]).map(x=>String(x||'').trim()).filter(Boolean))].sort();
  const declared=declaredFunctions(configText);
  const broad=paths.some(path=>path==='supabase/config.toml'||path.startsWith('supabase/functions/_shared/'));
  if(broad)return declared;
  const direct=new Set();
  for(const path of paths){
    const match=path.match(/^supabase\/functions\/([^/]+)\//);
    if(!match)continue;
    const slug=match[1];
    if(slug.startsWith('_'))continue;
    direct.add(slug);
  }
  return [...direct].sort();
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const changedFile=process.argv[2];
  if(!changedFile)throw new Error('CHANGED_PATHS_FILE_REQUIRED');
  const changedPaths=readFileSync(changedFile,'utf8').split(/\r?\n/).filter(Boolean);
  const configText=readFileSync('supabase/config.toml','utf8');
  process.stdout.write(resolveEdgeRuntimeFunctions({changedPaths,configText}).join('\n'));
  if(resolveEdgeRuntimeFunctions({changedPaths,configText}).length)process.stdout.write('\n');
}
