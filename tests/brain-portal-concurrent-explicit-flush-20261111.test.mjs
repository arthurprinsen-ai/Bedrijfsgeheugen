import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Exercise the real original authenticated Portal V2 handoff and tenant test harness.
await import('../portal-v2/tests/portal-handoff-recovery.test.mjs');

test('only original portal flush queues explicitly requested concurrent saves',()=>{
 const domain=readFileSync(new URL('../portal-v2/domain-state.js',import.meta.url),'utf8');
 const skill=readFileSync(new URL('../.agents/skills/portal-living-interface/SKILL.md',import.meta.url),'utf8');
 const team=readFileSync(new URL('../platform/agents/agent-team.mjs',import.meta.url),'utf8');
 assert.match(domain,/let queuedExplicitPortalFlush=null/);
 assert.match(domain,/if\(activePortalFlush\)[\s\S]*queuedExplicitPortalFlush=activePortalFlush\.then/);
 assert.match(domain,/pendingBusinessInputs\.size>0\|\|pendingImpacts\.length>0\|\|journalCleanupPending/);
 assert.match(domain,/error=>\{queuedExplicitPortalFlush=null;throw error;\}/);
 assert.match(skill,/explicit-concurrent-flush-joined-old-promise/);
 assert.match(team,/reconcile-explicit-concurrent-portal-flush-to-newest-authorized-revision-without-second-writer/);
 assert.doesNotMatch(domain,/setInterval\(|new Worker\(|service_role|cron\.schedule/);
});
