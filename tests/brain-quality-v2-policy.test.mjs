import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('powerhouse/assurance/quality-intelligence-v2.json','utf8'));
test('v2 inherits existing release authorities',()=>{assert.equal(c.authorities.delivery,'BRAIN-DELIVERY-v2');assert.equal(c.authorities.learning,'BRAIN-CLOSED-LOOP-v1');assert.equal(c.authorities.production,'BG169');assert.equal(c.authorities.assurance,'powerhouse-quality-intelligence-v1');});
test('deep sensors do not imply proof',()=>{for(const v of Object.values(c.deep_sensors)) assert.notEqual(v,'proven');});
test('CI contract keeps deep sensors outside unconditional fast lane',()=>assert.equal(c.ci_contract.deep_sensors,'scheduled_manual_or_risk_triggered'));
