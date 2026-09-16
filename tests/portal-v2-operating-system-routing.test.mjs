import test from 'node:test';
import assert from 'node:assert/strict';
import {allPageIds,findPage} from '../portal-v2/page-registry.js';
import {hubPages,unassignedPortalPages} from '../portal-v2/hubs.js';
import {navigationUrl} from '../portal-v2/navigation-model.js';

const OS=['os:impact-engine','os:scenario-simulator','os:next-best-actions','os:monitoring-learning','os:evidence-health','os:capability-graph'];

test('all operating system modules live in canonical portal registry',()=>{
 const pages=new Set(allPageIds());for(const id of OS){assert.ok(pages.has(id));assert.ok(findPage(id)?.label);}
 assert.deepEqual(unassignedPortalPages().filter(id=>OS.includes(id)),[]);
});

test('existing hubs expose operating system routes without a parallel shell',()=>{
 assert.ok(hubPages('data-ai').includes('os:evidence-health'));
 assert.ok(hubPages('data-ai').includes('os:capability-graph'));
 assert.ok(hubPages('tasks').includes('os:next-best-actions'));
 assert.ok(hubPages('tasks').includes('os:monitoring-learning'));
});

test('OS route uses the existing page query contract',()=>{
 const url=navigationUrl('os:scenario-simulator','https://www.bedrijfsgeheugen.nl/portal-v2/');
 assert.equal(url,'/portal-v2/?page=os%3Ascenario-simulator');
});
