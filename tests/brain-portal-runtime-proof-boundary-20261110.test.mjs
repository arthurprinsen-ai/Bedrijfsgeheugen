import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mapRuntimeProjection} from '../portal-v2/runtime-evidence.js';

test('ONE BRAIN portal evidence projection cannot mark missing health as green',async()=>{
 const source=await readFile(new URL('../portal-v2/runtime-evidence.js',import.meta.url),'utf8');
 const skill=await readFile(new URL('../.agents/skills/portal-living-interface/SKILL.md',import.meta.url),'utf8');
 const mapped=mapRuntimeProjection({integrationHealth:{components:[{name:'never probed'}]},aiGovernance:{systems:[{systemName:'risk not assessed'}]}});
 assert.equal(mapped.sources.items[0].healthy,false);
 assert.equal(mapped.governance.items[0].healthy,false);
 assert.match(source,/invalidateRuntime\(domainState,validateSession,'AUTH_REVOKED'\)/);
 assert.match(source,/invalidateRuntime\(domainState,validateSession,'SOURCE_UNAVAILABLE'\)/);
 assert.match(skill,/unverified runtime|onbevestigde runtime/i);
});
