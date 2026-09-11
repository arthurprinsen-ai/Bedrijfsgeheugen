import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function collectTests(dir){
  if(!fs.existsSync(dir)) return [];
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...collectTests(full));
    else if(entry.isFile()&&/\.test\.mjs$/.test(entry.name)) out.push(full);
  }
  return out;
}

const scriptTests=fs.readdirSync('scripts/brain').filter(f=>/^test-.*\.mjs$/.test(f)&&f!=='test-all.mjs').sort();
const repoTests=fs.readdirSync('tests').filter(f=>/^(chat-to-brain-.*|whole-brain-.*)\.test\.mjs$/.test(f)).sort().map(f=>`tests/${f}`);
const brainModuleTests=collectTests('brain').sort();
const files=[...scriptTests.map(f=>`scripts/brain/${f}`),...repoTests,...brainModuleTests];
let failed=0;
for(const file of files){
  const r=spawnSync(process.execPath,['--test',file],{encoding:'utf8'});
  process.stdout.write(`\n### ${file}\n${r.stdout||''}`);
  if(r.status!==0){process.stderr.write(r.stderr||'');failed++;}
}
if(failed) throw new Error(`${failed}/${files.length} Brain test files failed`);
console.log(`\nPASS ${files.length} Brain test files`);
