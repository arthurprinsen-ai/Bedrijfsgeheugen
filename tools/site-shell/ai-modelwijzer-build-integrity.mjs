import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SNAPSHOT='.artifacts/ai-modelwijzer-source.html';
const PAGE='ai-modelwijzer.html';

function extractMain(html){
  const m=String(html).match(/<main\b[^>]*>[\s\S]*?<\/main>/i);
  if(!m) throw new Error('ai-modelwijzer integrity: missing <main>');
  return m[0];
}
function extractRuntimeScripts(html){
  const list=[...String(html).matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi)];
  const wanted=['/assets/js/ai-model-catalog.js','/assets/js/ai-modelwijzer.mjs'];
  return wanted.map(prefix=>{
    const hit=list.find(m=>String(m[1]).startsWith(prefix));
    if(!hit) throw new Error('ai-modelwijzer integrity: missing runtime '+prefix);
    return {prefix,tag:hit[0]};
  });
}
function assertCanonical(html){
  const required=['Welk AI-model past bij','Volledige modelvergelijking','Data governance & data-soevereiniteit','Valkuilen die de Modelwijzer expliciet meeneemt','id="goal"','id="leadForm"','https://www.bedrijfsgeheugen.nl/frisse-blik'];
  const missing=required.filter(x=>!html.includes(x));
  if(missing.length) throw new Error('ai-modelwijzer integrity: missing '+missing.join(' | '));
  if(html.includes('privacy,slag')) throw new Error('ai-modelwijzer integrity: corrupted data-opslag copy');
}

const mode=process.argv[2]||'';
if(mode==='capture'){
  const source=await readFile(PAGE,'utf8');
  assertCanonical(source);
  await mkdir('.artifacts',{recursive:true});
  await writeFile(SNAPSHOT,source,'utf8');
  console.log('Captured canonical AI Modelwijzer before legacy transforms');
}else if(mode==='restore'){
  const [source,built]=await Promise.all([readFile(SNAPSHOT,'utf8'),readFile(PAGE,'utf8')]);
  const main=extractMain(source);
  const scripts=extractRuntimeScripts(source);
  let restored=String(built).replace(/<main\b[^>]*>[\s\S]*?<\/main>/i,main);
  for(const item of scripts){
    const tags=[...restored.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi)];
    const hit=tags.find(m=>String(m[1]).startsWith(item.prefix));
    if(hit) restored=restored.replace(hit[0],item.tag);
    else restored=restored.replace(/<\/body>/i,item.tag+'\n</body>');
  }
  assertCanonical(restored);
  await writeFile(PAGE,restored,'utf8');
  console.log('Restored canonical AI Modelwijzer content after legacy transforms');
}else{
  throw new Error('usage: node tools/site-shell/ai-modelwijzer-build-integrity.mjs capture|restore');
}
