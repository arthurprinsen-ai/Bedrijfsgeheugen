import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createDeliveryPlan} from '../tools/brain-delivery-system.mjs';

test('supervisor YAML literal blocks retain complete valid shell scripts',()=>{
  const lines=fs.readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8').split(/\r?\n/);
  const scripts=[];
  for(let i=0;i<lines.length;i++){
    const header=lines[i].match(/^(\s*)run:\s*\|[-+]?\s*$/);
    if(!header) continue;
    let first=i+1;
    while(first<lines.length&&!lines[first].trim()) first++;
    const indentation=lines[first]?.match(/^ */)[0].length;
    assert.ok(indentation>header[1].length,'Literal run block needs indented content');
    const content=[];
    for(let j=i+1;j<lines.length;j++){
      if(lines[j].trim()&&lines[j].match(/^ */)[0].length<indentation) break;
      content.push(lines[j].slice(indentation));
    }
    scripts.push({line:i+1,content:content.join('\n')+'\n'});
  }
  assert.ok(scripts.length>0,'Expected supervisor literal shell blocks');
  for(const script of scripts){
    const shell=spawnSync('bash',['-n'],{input:script.content,encoding:'utf8'});
    assert.equal(shell.status,0,`Supervisor run block at line ${script.line} must be complete shell after YAML indentation removal: ${shell.stderr || shell.error || ''}`);
  }
});

test('canonical supervisor YAML regression belongs only to the automation lane',()=>{
  const policy=JSON.parse(fs.readFileSync('config/brain-delivery-system.json','utf8'));
  const plan=createDeliveryPlan({changedPaths:['tests/brain-delivery-supervisor-yaml-scalar-v1.test.mjs'],headSha:'abcdef1234567890',policy});
  assert.deepEqual(plan.lanes.map(lane=>lane.id),['automation']);
});
