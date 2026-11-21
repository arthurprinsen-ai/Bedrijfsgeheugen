import {lstat,readFile,readdir,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

/** Only independently reviewed, pure, read-only browser computations. */
export const PUBLIC_PORTAL_BROWSER_SOURCES=Object.freeze([
  'brain/context/business-context-engine.mjs',
  'brain/context/goal-forecast-engine.mjs',
  'brain/context/goal-scenario-engine.mjs',
  'brain/context/goal-outcome-learning.mjs',
  'brain/economics/management-accounting-intelligence.mjs',
  'brain/revenue/need-discovery.mjs',
  'platform/organism/organism-graph.mjs',
]);
const approved=new Set(PUBLIC_PORTAL_BROWSER_SOURCES);
const publishedRoot='portal-v2/browser-runtime';
const importPattern=/\b(from\s*|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]+)\2/g;
const privateCodeGuards=[
  /\bprocess\.env\b/,/\bDeno\.env\b/,/\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,/\blocalStorage\b/,/\bsessionStorage\b/,
  /\bdocument\.cookie\b/,/\bimport\s*\(/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,/\bservice_role\b/,
];

function normalizeImport(file,spec){
  const clean=String(spec).split(/[?#]/,1)[0];
  const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(file),clean));
  if(resolved==='..'||resolved.startsWith('../')||path.posix.isAbsolute(resolved))
    throw new Error('PORTAL_BROWSER_IMPORT_OUTSIDE_REPOSITORY');
  return resolved;
}
function replacePrivateImports({file,source}){
  let changed=0;
  const updated=source.replace(importPattern,(match,prefix,quote,spec)=>{
    const candidate=normalizeImport(file,spec);
    if(!(candidate.startsWith('brain/')||candidate.startsWith('platform/')))return match;
    if(!approved.has(candidate))
      throw new Error('PORTAL_BROWSER_PRIVATE_IMPORT_NOT_APPROVED:'+candidate);
    changed++;
    const published=path.posix.join(publishedRoot,candidate);
    let relative=path.posix.relative(path.posix.dirname(file),published);
    if(!relative.startsWith('.'))relative='./'+relative;
    const suffix=spec.slice(spec.split(/[?#]/,1)[0].length);
    return prefix+quote+relative+suffix+quote;
  });
  return {updated,changed};
}

async function assertSourceRegular(root,file){
  const abs=path.join(root,...file.split('/'));
  const stat=await lstat(abs);
  if(!stat.isFile()||stat.isSymbolicLink())throw new Error('PORTAL_BROWSER_MODULE_NOT_REGULAR_FILE:'+file);
  return abs;
}
async function listPortalJs(root,relative='portal-v2',found=[]){
  const directory=path.join(root,...relative.split('/'));
  const entries=await readdir(directory,{withFileTypes:true});
  for(const entry of entries){
    if(entry.isSymbolicLink())throw new Error('PORTAL_BROWSER_PUBLIC_SYMLINK_BLOCKED');
    const child=path.posix.join(relative,entry.name);
    if(entry.isDirectory()){
      if(['browser-runtime','tests','node_modules'].includes(entry.name))continue;
      await listPortalJs(root,child,found);
    }else if(entry.isFile()&&/\.(?:m?js)$/.test(entry.name))found.push(child);
  }
  if(found.length>1200)throw new Error('PORTAL_BROWSER_PUBLIC_SCRIPT_SCOPE_EXCEEDED');
  return found;
}

export async function buildPortalPublicRuntime({root=process.cwd()}={}){
  const canonical=path.resolve(root);
  const copied=[];
  // Inspect all approved source/transitive imports before writing anything.
  for(const source of PUBLIC_PORTAL_BROWSER_SOURCES){
    const abs=await assertSourceRegular(canonical,source);
    const code=await readFile(abs,'utf8');
    if(privateCodeGuards.some(pattern=>pattern.test(code)))
      throw new Error('PORTAL_BROWSER_SOURCE_UNSAFE:'+source);
    for(const match of code.matchAll(importPattern)){
      const imported=normalizeImport(source,match[3]);
      if(!approved.has(imported))
        throw new Error('PORTAL_BROWSER_TRANSITIVE_PRIVATE_IMPORT_NOT_APPROVED:'+source+':'+imported);
    }
    copied.push({source,code,sha256:createHash('sha256').update(code).digest('hex')});
  }
  const changes=[];
  for(const file of await listPortalJs(canonical)){
    const abs=await assertSourceRegular(canonical,file);
    const code=await readFile(abs,'utf8');
    const converted=replacePrivateImports({file,source:code});
    if(converted.changed)changes.push({file,content:converted.updated,replaced:converted.changed});
  }
  if(!changes.length)throw new Error('PORTAL_BROWSER_NO_PRIVATE_IMPORTS_FOUND');
  const publicDir=path.join(canonical,'portal-v2','browser-runtime');
  const existing=await lstat(publicDir).catch(error=>error?.code==='ENOENT'?null:Promise.reject(error));
  if(existing&&(!existing.isDirectory()||existing.isSymbolicLink()))
    throw new Error('PORTAL_BROWSER_PUBLIC_DIRECTORY_NOT_SAFE');
  if(existing)await rm(publicDir,{recursive:true,force:true});
  for(const item of copied){
    const output=path.join(canonical,...publishedRoot.split('/'),...item.source.split('/'));
    await mkdir(path.dirname(output),{recursive:true});
    await writeFile(output,item.code,'utf8');
  }
  for(const change of changes){
    await writeFile(path.join(canonical,...change.file.split('/')),change.content,'utf8');
  }
  const manifest={
    contract:'PUBLIC_PORTAL_READ_ONLY_MODULE_V1',
    sources:copied.map(({source,sha256})=>({source,url:'/'+path.posix.join(publishedRoot,source),sha256})),
    imports_rewritten:changes.reduce((n,item)=>n+item.replaced,0),
    browser_files:changes.map(({file})=>file),
    original_source_unchanged:true,
    blocked_roots:['/brain/*','/platform/*'],
  };
  await writeFile(path.join(publicDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log('PUBLIC_PORTAL_BROWSER_MODULES_BUILT',JSON.stringify(manifest));
  return manifest;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await buildPortalPublicRuntime();
}
