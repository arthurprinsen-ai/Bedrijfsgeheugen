import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const context=fs.readFileSync('portal-v2/operating-system/company-intelligence-context.js','utf8');
const ui=fs.readFileSync('portal-v2/operating-system/operating-system-ui.js','utf8');
const cockpit=fs.readFileSync('portal-v2/operating-system/executive-cockpit.js','utf8');
const companyCockpit=fs.readFileSync('portal-v2/company-cockpit-ui.js','utf8');
const roadmap=fs.readFileSync('portal-v2/modules/roadmap-workspace.js','utf8');
const shell=fs.readFileSync('portal-v2/page-shell.js','utf8');
const styles=fs.readFileSync('portal-v2/company-intelligence-context.css','utf8');

test('Company Intelligence OS is projected contextually instead of as a separate dashboard',()=>{
 assert.match(context,/Powerhouse ziet nu/);
 assert.match(context,/tenant-scoped/);
 assert.match(context,/Outcome Memory/);
 assert.match(context,/Company Graph context/);
 for(const surface of ['impact-engine','next-best-actions','monitoring-learning','evidence-health']) assert.ok(ui.includes(`renderCompanyIntelligenceContext(state,'${surface}')`));
 assert.match(cockpit,/renderCompanyIntelligenceContext\(model,'executive-cockpit'\)/);
 assert.match(companyCockpit,/renderCompanyIntelligenceContext\(runtime,'company-cockpit'\)/);
 assert.match(roadmap,/renderCompanyIntelligenceContext\(state,'roadmap'\)/);
 assert.match(shell,/company-intelligence-context\.css/);
 assert.match(styles,/\.ci-mini-graph/);
 assert.match(styles,/\.v2roadmapintel/);
});

test('context projection fails closed when tenant evidence is missing',()=>{
 assert.match(context,/Nog onvoldoende bewezen context/);
 assert.doesNotMatch(context,/powerhouse_company_graph_nodes_v1/);
 assert.doesNotMatch(context,/powerhouse_system_of_context_v1/);
});
