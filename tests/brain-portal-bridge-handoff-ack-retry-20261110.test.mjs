import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildPortalEvidence} from '../portal-v2/powerhouse-runtime-bridge.js';

test('P0 #4215 original Powerhouse bridge does not lose unacknowledged handoffs',async()=>{
 const source=await readFile(new URL('../portal-v2/powerhouse-runtime-bridge.js',import.meta.url),'utf8');
 const skill=await readFile(new URL('../.agents/skills/portal-living-interface/SKILL.md',import.meta.url),'utf8');
 assert.match(source,/const pending=new Map\(\)/);
 assert.match(source,/async function flushPending\(\)/);
 assert.match(source,/if\(ack&&pending\.get\(key\)===entry\)pending\.delete\(key\)/);
 assert.match(source,/body\?\.record\?\.id/);
 assert.match(source,/record\.correlationId/);
 assert.match(source,/principal!==queuePrincipal/);
 assert.match(source,/currentPrincipal\(\)/);
 assert.match(source,/void flushPending\(\)/);
 assert.match(skill,/immutable handoff|onbevestigde overdracht/i);
 const evidence=buildPortalEvidence({id:'persisted-source-rev',idempotencyKey:'portal-source:rev',observedAt:'2026-11-10T11:00:00Z'});
 assert.equal(evidence.id,'PORTAL_EVIDENCE-persisted-source-rev');
 assert.equal(evidence.idempotencyKey,'portal-source:rev');
 assert.equal(evidence.executed,false);
 assert.equal(evidence.verified,false);
});
