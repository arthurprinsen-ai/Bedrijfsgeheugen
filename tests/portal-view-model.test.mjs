import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleState } from '../portal/data.mjs';
import { buildTodayViewModel,buildBusinessGraphViewModel,buildImpactViewModel,buildHealthViewModel,buildAdminViewModel } from '../portal/view-model.mjs';
test('today view preserves legacy management summary sections and KPI cards',()=>{const vm=buildTodayViewModel(sampleState);assert.deepEqual(vm.managementSummary.sections.map(x=>x.id),['opportunities','threats','trends','conclusion']);assert.deepEqual(vm.healthCards.slice(0,5).map(x=>x.id),['bedrijfsgezondheid','kennisborging','processen','data-systemen','ai-volwassenheid']);assert.equal(vm.roadmap.length,4);assert.equal(vm.recommendedActions.length,6);assert.equal(vm.quickLinks.length,8)});
test('business graph preserves all legacy nodes and adds new nodes',()=>{const vm=buildBusinessGraphViewModel(sampleState);assert.deepEqual(vm.legacyNodes.map(x=>x.label),['Kennis','Processen','Mensen','Doelen & strategie','Systemen','Data','Acties']);for(const label of ['Klanten','Producten & diensten','Markt',"KPI's",'Besluiten','Risico’s','Capabilities','Leveranciers','Finance'])assert.ok(vm.nodes.some(x=>x.label===label))});
test('impact only counts evidence-backed realised value',()=>assert.equal(buildImpactViewModel(sampleState).verifiedTotal,83500));
test('health view retains baseline score cards',()=>assert.equal(buildHealthViewModel(sampleState).cards.length,5));
test('admin view exposes integrations billing users governance and agents',()=>{const vm=buildAdminViewModel(sampleState);assert.equal(vm.admin.billing.plan,'Control');assert.equal(vm.agents.length,7);assert.equal(vm.admin.governance.aiUseCases,14)});
