import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=fs.readdirSync('scripts/brain').filter(f=>/^test-.*\.mjs$/.test(f)&&f!=='test-all.mjs').sort();
let failed=0;
for(const file of files){
  const r=spawnSync(process.execPath,[`scripts/brain/${file}`],{encoding:'utf8'});
  process.stdout.write(`\n### ${file}\n${r.stdout||''}`);
  if(r.status!==0){process.stderr.write(r.stderr||'');failed++;}
}
if(failed) throw new Error(`${failed}/${files.length} Brain test files failed`);
console.log(`\nPASS ${files.length} Brain test files`);
