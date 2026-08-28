import fs from 'node:fs';
const path='docs/brain/component-registry.json';
const allowedRoles=new Set(['SENSOR','MEMORY','CORTEX','GOVERNOR','WORKER','ACTUATOR','CONTROL_PLANE']);
const data=JSON.parse(fs.readFileSync(path,'utf8'));
if(data.registry_version!=='brain-components-v1') throw new Error('unsupported registry_version');
if(!Array.isArray(data.components)||!data.components.length) throw new Error('components missing');
const ids=new Set(); const keys=new Set();
for(const c of data.components){
  for(const f of ['key','id','name','role','cortex','authority','status','brain_contract_version']) if(c[f]===undefined||c[f]===null||c[f]==='') throw new Error(`${c.key||'unknown'} missing ${f}`);
  if(c.status==='active'&&!allowedRoles.has(c.role)) throw new Error(`${c.key} invalid role ${c.role}`);
  if(c.status==='active'&&!c.cortex) throw new Error(`${c.key} missing cortex`);
  if(c.brain_contract_version!=='brain.v1') throw new Error(`${c.key} unsupported contract version`);
  if(ids.has(c.id)) throw new Error(`duplicate id ${c.id}`); ids.add(c.id);
  if(keys.has(c.key)) throw new Error(`duplicate key ${c.key}`); keys.add(c.key);
}
console.log(`registry valid: ${data.components.length} components`);
