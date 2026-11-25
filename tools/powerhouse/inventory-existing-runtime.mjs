// Read-only inventory of existing Powerhouse runtime entry points.
// This script deliberately does not create a new scheduler or mutate production.
import {readdir,open} from 'node:fs/promises';
import path from 'node:path';
const roots=['.github/workflows','netlify/functions','tools','supabase/migrations'];
const pattern=/powerhouse|heartbeat|orchestrat|obligation|commercial|revenue|portal|outbox|retry|lease|source.universe/i;
const ignored=new Set(['node_modules','.git','.netlify','dist','build']);
async function walk(dir,depth=0){
 if(depth>5)return [];
 let entries;try{entries=await readdir(dir,{withFileTypes:true});}catch{return [];}
 const out=[];
 for(const e of entries){
  if(ignored.has(e.name))continue;
  const p=path.join(dir,e.name);
  if(e.isDirectory()){out.push(...await walk(p,depth+1));continue;}
  if(!e.isFile()||!(/\.(?:mjs|js|ts|sql|ya?ml|json)$/.test(e.name)))continue;
  if(pattern.test(p)){out.push({path:p.replaceAll('\\','/'),matched:'path'});continue;}
  // bounded content sampling, never scan secrets or private runtime values
  let handle;
  try {
   handle=await open(p,'r');
   const info=await handle.stat();
   if(!info.isFile()||info.size>200000)continue;
   const buffer=Buffer.alloc(Math.min(info.size,20000));
   const {bytesRead}=await handle.read(buffer,0,buffer.length,0);
   if(pattern.test(buffer.toString('utf8',0,bytesRead)))out.push({path:p.split(path.sep).join('/'),matched:'content'});
  } catch { continue; } finally { await handle?.close(); }
 }
 return out;
}
const results=(await Promise.all(roots.map(x=>walk(x)))).flat().sort((a,b)=>a.path.localeCompare(b.path));
const byRoot=Object.fromEntries(roots.map(root=>[root,results.filter(r=>r.path.startsWith(root+'/')).length]));
console.log(JSON.stringify({contract:'POWERHOUSE_EXISTING_STATE_INVENTORY_V1',total:results.length,byRoot,files:results},null,2));
