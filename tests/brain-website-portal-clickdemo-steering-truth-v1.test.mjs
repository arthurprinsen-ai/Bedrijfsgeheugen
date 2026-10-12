import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('klantportaal-demo.html','utf8');

test('sales clickdemo leads with operator outcome, not a second AI-tool proposition',()=>{
  assert.match(source, /data-demo-steering="v1"/);
  assert.match(source, /dagelijkse ondernemingssturing/i);
  assert.match(source, /Wat verandert er — wat beslis je — wat werkt\?/);
  assert.match(source, /Niet nog een AI-tool of dashboard/);
  assert.match(source, /eigen bedrijfscontext en vereist bronbewijs/);
  assert.match(source, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/"/);
});

test('five steps use the clickdemo’s already registered navigation, no parallel router',()=>{
  const journey=source.slice(source.indexOf('data-demo-steering="v1"'),source.indexOf('<section class="paneel aan" id="p-dashboard">'));
  const routes=[...journey.matchAll(/data-demo-target="([a-z]+)"/g)].map(x=>x[1]);
  assert.deepEqual(routes,['omgeving','strategie','maandag','acties','versies']);
  assert.match(source, /function ganaar\(p\)/);
  assert.match(source, /querySelectorAll\('#demoJourney \[data-demo-target\]'\)/);
  for(const route of routes) assert.ok(source.includes("'"+route+"'"),route+' is an existing demo page id');
});

test('visible demo disclosure cannot be confused with real observed customer signals or gains',()=>{
  assert.match(source, /Klikdemo · fictieve gegevens/);
  assert.match(source, /De gegevens, personen, scores en acties op deze pagina zijn gesimuleerd/);
  assert.match(source, /Er zijn geen live klant- of externe bronnen gekoppeld/);
  assert.match(source, /Deze klikdemo gebruikt fictieve gegevens/);
  assert.match(source, /robots" content="noindex"/);
});

test('the journey is inert HTML, not concatenated into a dynamic innerHTML sink',()=>{
 assert.ok(source.indexOf('id="demoJourney"')<source.indexOf('id="p-dashboard"'));
 const dashboard=source.slice(source.indexOf('function tekenDashboard()'),source.indexOf('function geefRecht('));
 assert.doesNotMatch(dashboard,/data-demo-steering/);
 assert.match(source,/journey\.hidden=p!=='dashboard'/);
 assert.match(source,/demoIntro\.textContent=/);
 assert.match(source,/button\.addEventListener\('click',function\(\)\{ganaar\(button\.dataset\.demoTarget\);\}\)/);
});

test('existing demo JavaScript remains parseable and responsive',()=>{
  const js=source.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(js);
  assert.doesNotThrow(()=>new vm.Script(js,{filename:'klantportaal-demo.html'}));
  assert.match(source, /@media\(max-width:540px\)\{\.demo-flow/);
  assert.match(source, /\.demo-flow button:focus-visible/);
});
