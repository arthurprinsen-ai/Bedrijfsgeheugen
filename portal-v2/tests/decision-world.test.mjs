import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildDecisionWorldNodes} from '../decision-world.js';

const home={authenticated:true,headline:'Een bedrijf dat blijft draaien',selectedGoal:'resilience'};
const steps=[
 {id:'scan',confirmed:true,detail:'Zelfgerapporteerde nulmeting gekoppeld'},
 {id:'goal',confirmed:true,detail:'Doel gekozen'},
 {id:'evidence',confirmed:false,detail:'Geen actuele klantbron'},
 {id:'decision',confirmed:false,detail:'Nog geen brononderbouwd voorstel'},
 {id:'outcome',confirmed:false,detail:'Geen onafhankelijk resultaat'}
];

test('guests and demos cannot see customer evidence through the company map',()=>{
 assert.deepEqual(buildDecisionWorldNodes({}, {authenticated:true,steps}),[]);
 assert.deepEqual(buildDecisionWorldNodes({authenticated:true},{authenticated:false,steps}),[]);
});

test('confirmed goal and scan never imply a confirmed result',()=>{
 const nodes=buildDecisionWorldNodes(home,{authenticated:true,steps});
 assert.deepEqual(nodes.map(n=>n.id),['scan','goal','evidence','decision','outcome']);
 assert.deepEqual(nodes.map(n=>n.confirmed),[true,true,false,false,false]);
 assert.equal(nodes[4].status,'Effect niet aangetoond');
 assert.equal(nodes[0].detail,'Zelfgerapporteerde nulmeting gekoppeld');
 assert.ok(Object.isFrozen(nodes));
});

test('missing or malformed proof fails closed rather than showing success',()=>{
 const nodes=buildDecisionWorldNodes(home,{authenticated:true,steps:[{id:'outcome',confirmed:'true',detail:123}]});
 assert.equal(nodes[4].confirmed,false);
 assert.match(nodes[4].detail,/nog geen gecontroleerde/);
 assert.equal(nodes[2].confirmed,false);
});

test('the map uses the canonical original hero and has safe, responsive interaction',async()=>{
 const [ui,entry,css,html]=await Promise.all([
  readFile(new URL('../decision-world.js',import.meta.url),'utf8'),
  readFile(new URL('../entrepreneur-home.js',import.meta.url),'utf8'),
  readFile(new URL('../decision-world.css',import.meta.url),'utf8'),
  readFile(new URL('../index.html',import.meta.url),'utf8')
 ]);
 assert.match(entry,/renderDecisionWorld\(next,\{home:model,journey,selectedStage:worldStage/);
 assert.match(entry,/worldStage='decision'/);
 assert.match(ui,/aria-pressed/);
 assert.match(ui,/ArrowRight/);
 assert.match(css,/\.bdw-orbit/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(html,/decision-world\.css\?v=20261110/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage|fetch\(|innerHTML|outerHTML|setInterval|setTimeout/);
 assert.doesNotMatch(ui,/€\s*\d|\b100%\b|autonomousExecutionVerified/);
});
