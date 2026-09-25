import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync('portal-v2/operating-system/operating-system-ui.js','utf8');
const styles=fs.readFileSync('portal-v2/operating-system/styles.js','utf8');
const contract=JSON.parse(fs.readFileSync('config/powerhouse-problem-radar-intake-contract.json','utf8'));

test('contextual Problem Radar is embedded in relevant Powerhouse surfaces',()=>{
 const surfaces=contract.routing.contextual_portal_projection.surfaces;
 for(const surface of ['executive-cockpit','impact-engine','next-best-actions','monitoring-learning','evidence-health']) assert.ok(surfaces.includes(surface));
 for(const surface of ['impact-engine','next-best-actions','monitoring-learning','evidence-health']) assert.ok(ui.includes(`renderProblemContext(state,'${surface}')`));
 assert.match(ui,/Relevante Probleemradar-context/);
 assert.match(ui,/externe signalen blijven context totdat tenant-evidence ze bevestigt/);
 assert.match(styles,/os-context-strip/);
 assert.match(styles,/os-signal-meter/);
 assert.equal(contract.routing.contextual_portal_projection.external_context_requires_tenant_relevance,true);
 assert.equal(contract.routing.contextual_portal_projection.preserve_evidence_drawer,true);
});
