import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('powerhouse/assurance/quality-intelligence-v2.json','utf8'));
test('all registered v2 implementation files exist',()=>{for(const p of Object.values(c.implementation)) assert.equal(fs.existsSync(p),true,p);});
test('v2 assurance projection exists',()=>assert.equal(fs.existsSync('powerhouse/assurance/quality-intelligence-v2-component.json'),true));
