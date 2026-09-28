import assert from 'node:assert/strict';
import fs from 'node:fs';

const agents = fs.readFileSync('AGENTS.md','utf8');
const map = fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');
const skill = fs.readFileSync('.agents/skills/powerhouse-system-map-governance/SKILL.md','utf8');
const doc = fs.readFileSync('docs/powerhouse/POWERHOUSE_SYSTEM_MAP_GOVERNANCE.md','utf8');

assert.match(agents,/SYSTEM_MAP_WRITEBACK_INCOMPLETE/);
assert.match(agents,/canonical-system-map\.mjs/);
assert.match(map,/same-lineage-auto-writeback/);
assert.match(map,/powerhouse-system-map-governance/);
assert.match(map,/portal-v2\/\?page=powerhouse-control-center/);
assert.match(skill,/Every current and future chat, agent/);
assert.match(skill,/SYSTEM_MAP_WRITEBACK_INCOMPLETE/);
assert.match(doc,/Definition of Done/);
assert.match(doc,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/\?page=powerhouse-control-center/);

console.log('Powerhouse System Map governance contract: OK');
