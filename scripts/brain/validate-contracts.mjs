import fs from 'node:fs';
import path from 'node:path';
const dir='brain/contracts';
const envelope=JSON.parse(fs.readFileSync(path.join(dir,'envelope.schema.json'),'utf8'));
export function validate(type,obj){
  const schema=JSON.parse(fs.readFileSync(path.join(dir,`${type}.schema.json`),'utf8'));
  const required=[...envelope.required,...schema.required];
  const missing=required.filter(k=>obj[k]===undefined||obj[k]===null||obj[k]==='');
  if(missing.length) return {valid:false,errors:missing.map(k=>`missing:${k}`)};
  const errors=[];
  if(obj.schema_version!=='brain.v1') errors.push('schema_version');
  if(typeof obj.confidence!=='number'||obj.confidence<0||obj.confidence>1) errors.push('confidence');
  for(const [field,values] of Object.entries(schema.enums||{})) if(!values.includes(obj[field])) errors.push(`enum:${field}`);
  return {valid:errors.length===0,errors};
}
if(import.meta.url===`file://${process.argv[1]}`){
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.schema.json'));
  if(files.length!==10) throw new Error(`expected 10 schema files, got ${files.length}`);
  for(const f of files){JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))}
  console.log('contract schemas valid');
}
