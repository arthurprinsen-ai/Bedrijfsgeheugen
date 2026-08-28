import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const p='docs/brain/component-registry.json';
if(!fs.existsSync(p)) throw new Error('component registry missing');
const run=spawnSync(process.execPath,['scripts/brain/validate-component-registry.mjs'],{encoding:'utf8'});
if(run.status!==0) throw new Error(run.stderr||run.stdout);
const data=JSON.parse(fs.readFileSync(p,'utf8'));
const required=['BG09','BG14','BG24','BG25','BG156','BG166','BG167','BG168','BG169','BG180',...Array.from({length:16},(_,i)=>`PH_AGENT_${String(i+1).padStart(2,'0')}`)];
for(const key of required){if(!data.components.some(c=>c.key===key)) throw new Error(`missing ${key}`)}
const active=data.components.filter(c=>c.status==='active');
for(const c of active){if(!c.role||!c.cortex) throw new Error(`${c.key} incomplete role/cortex`)}
console.log(`component registry test passed: ${required.length} required components present`);
