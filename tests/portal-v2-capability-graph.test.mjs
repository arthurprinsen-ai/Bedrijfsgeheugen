import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCapabilityGraph,neighbors} from '../portal-v2/operating-system/capability-graph.js';

test('graph connects capability through process/system/data/kpi to action and outcome without duplicate edges',()=>{
 const capabilities={sales:{n:'Sales',dim:'commercie',proc:['Lead'],sys:['CRM'],data:['Klant'],ai:['Scoring'],gov:['Owner'],kpi:['Conversie'],proj:['CRM verbeteren']}};
 const graph=buildCapabilityGraph({capabilities,objectives:[{id:'grow',capability_ids:['sales']}],actions:[{id:'a1',capability_id:'sales'}],outcomes:[{id:'o1',action_id:'a1'}]});
 assert.ok(graph.nodes.some(n=>n.id==='capability:sales'));assert.ok(graph.edges.some(e=>e.from==='action:a1'&&e.to==='outcome:o1'));
 assert.equal(new Set(graph.edges.map(e=>`${e.from}>${e.to}`)).size,graph.edges.length);
 assert.ok(neighbors(graph,'capability:sales').length>=5);
});
