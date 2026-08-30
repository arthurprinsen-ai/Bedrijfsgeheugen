import fs from 'node:fs';
const path='netlify/functions/brain-operating-loop.mjs';
if(!fs.existsSync(path)) throw new Error('Brain operating Netlify function missing');
const src=fs.readFileSync(path,'utf8');
for(const required of ["@netlify/identity","@netlify/blobs","createOperatingLoopStore","createBlobAdapter","createOperatingLoopHandler","/api/brain-operating-loop"]){
  if(!src.includes(required)) throw new Error(`Brain operating function missing ${required}`);
}
if(src.includes('tenantId = body')||src.includes('body.tenantId')) throw new Error('Netlify wrapper must not trust client tenant');
console.log('operating loop Netlify function tests passed');
