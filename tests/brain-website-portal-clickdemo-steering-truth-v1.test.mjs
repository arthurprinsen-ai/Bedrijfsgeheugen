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
  assert.match(source, /eigen context en vereist bronbewijs/);
  assert.match(source, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/"/);
});

test('five steps use the clickdemo’s already registered navigation, no parallel router',()=>{
  const journey=source.slice(source.indexOf('data-demo-steering="v1"'),source.indexOf("+'</div><p class=\"demo-proof\""));
  const routes=[...journey.matchAll(/data-tab="([a-z]+)"/g)].map(x=>x[1]);
  assert.deepEqual(routes,['omgeving','strategie','maandag','acties','versies']);
  assert.match(source, /function ganaar\(p\)/);
  assert.match(source, /querySelectorAll\('\[data-tab\]'\)/);
  for(const route of routes) assert.ok(source.includes("'"+route+"'"),route+' is an existing demo page id');
});

test('visible demo disclosure cannot be confused with real observed customer signals or gains',()=>{
  assert.match(source, /Klikdemo · fictieve gegevens/);
  assert.match(source, /De gegevens, personen, scores en acties op deze pagina zijn gesimuleerd/);
  assert.match(source, /Dit is geen actuele bedrijfsanalyse/);
  assert.match(source, /Deze klikdemo laat met fictieve gegevens zien/);
  assert.match(source, /robots" content="noindex"/);
});

test('existing demo JavaScript remains parseable and responsive',()=>{
  const js=source.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(js);
  assert.doesNotThrow(()=>new vm.Script(js,{filename:'klantportaal-demo.html'}));
  assert.match(source, /@media\(max-width:540px\)\{\.demo-flow/);
  assert.match(source, /\.demo-flow button:focus-visible/);
});
