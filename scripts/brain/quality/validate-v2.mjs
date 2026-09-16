import fs from 'node:fs';
const file='powerhouse/assurance/quality-intelligence-v2.json'; const c=JSON.parse(fs.readFileSync(file,'utf8')); const gaps=[];
if(c.fingerprint!=='powerhouse-quality-intelligence-v2') gaps.push('fingerprint');
if(c.extends!=='powerhouse-quality-intelligence-v1') gaps.push('v1 inheritance');
if(c.release_decision!=='deterministic_evidence_only') gaps.push('deterministic release authority');
if(c.ai_policy?.release_authority!==false||c.ai_policy?.may_waive_gate!==false) gaps.push('AI release prohibition');
for(const [k,v] of Object.entries(c.capabilities||{})) if(v.enabled!==true) gaps.push(`capability:${k}`);
if(c.evidence_states?.unknown!=='blocking_when_required'||c.evidence_states?.not_registered!=='blocking_when_required') gaps.push('fail-closed evidence');
process.stdout.write(JSON.stringify({fingerprint:c.fingerprint,status:gaps.length?'BLOCKED':'READY',gaps},null,2)+'\n'); if(gaps.length) process.exitCode=1;
