import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js=fs.readFileSync('assets/growth-tools.js','utf8');
const css=fs.readFileSync('assets/growth-tools.css','utf8');
const benchmark=fs.readFileSync('benchmark.html','utf8');
const knowledge=fs.readFileSync('kennisverlies-vergrijzing-mkb.html','utf8');
const ma=fs.readFileSync('investeerders-ma.html','utf8');
const workshops=fs.readFileSync('workshops.html','utf8');
const scan=fs.readFileSync('frisse-blik.html','utf8');

test('public Growth Swarm tools are embedded into canonical existing pages',()=>{
  assert.match(benchmark,/data-growth-tool="friction-index"/);
  assert.match(knowledge,/data-growth-tool="lost-knowledge"/);
  assert.match(ma,/data-growth-tool="ma-risk"/);
  assert.match(workshops,/data-growth-tool="workshop-benchmark"/);
  for(const page of [benchmark,knowledge,ma,workshops]){
    assert.match(page,/assets\/growth-tools\.js/);
    assert.match(page,/assets\/growth-tools\.css/);
  }
  assert.ok(css.length>100);
});

test('public browser runtime exposes only privacy-safe tool calls',()=>{
  assert.match(js,/powerhouse-growth-tools/);
  for(const name of ['lost-knowledge','ma-risk','friction-index','workshop-benchmark']) assert.match(js,new RegExp(name));
  assert.doesNotMatch(js,/revenue-swarm/);
  assert.doesNotMatch(js,/bg_geheim/);
  assert.doesNotMatch(js,/service_role/i);
});

test('public benchmark and workshop surfaces fail closed instead of fabricating evidence',()=>{
  assert.match(js,/Nog onvoldoende data/);
  assert.match(js,/vijf geanonimiseerde waarnemingen/);
  assert.match(workshops,/vijf geldige inzendingen/i);
  assert.doesNotMatch(workshops,/individuele deelnemers worden openbaar/i);
});

test('Frisse Blik implements evidence-first reverse selling',()=>{
  assert.match(scan,/data-growth-policy="evidence-first"/);
  assert.match(scan,/nu niet kopen/i);
  assert.match(scan,/geen serieuze vervolgstap/i);
  assert.doesNotMatch(scan,/geld terug/i);
});

test('financial and M&A public copy labels estimates honestly',()=>{
  assert.match(knowledge,/SCENARIO_ESTIMATE/);
  assert.match(ma,/ESTIMATED_RISK/);
  assert.match(ma,/geen waardering/i);
});
