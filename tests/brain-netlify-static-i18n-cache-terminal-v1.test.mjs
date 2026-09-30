import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cachePath='config/bg-static-i18n-en.d/2026-09-30-current-main-terminal.json';
const skillPath='.agents/skills/powerhouse-netlify-production-truth/SKILL.md';

test('current-main static i18n terminal recovery preserves fail-closed cache completeness',()=>{
  const cache=JSON.parse(fs.readFileSync(cachePath,'utf8'));
  const required=[
    '-compliance hangt ook af van doel, grondslag, verwerkersafspraken, dataminimalisatie, beveiliging, subprocessors, retentie en jouw concrete implementatie.',
    'Bekijk per deploymentpad opslag, inferentie, training, retentie, zero-data-retention, sleutels, private networking en self-hosting.',
    'De advisor behandelt EU-verwerking als één constraint. Voor gereguleerde of strategische data kan self-hosting of een customer-controlled cloud-deployment zwaarder wegen dan een kleine benchmarkwinst.',
    'Drie onderdelen van duurzame kennisborging',
    'Kennis in hoofd',
    'Onderhoud',
    'Providernaam alleen zegt te weinig.',
    'Structuur',
    'Toegang',
    'Van kennis in één hoofd naar geborgde bedrijfskennis',
    'Vindbaar + actueel + bruikbaar',
    'geborgd in de organisatie',
    'kwetsbaar',
    'waar staat wat?',
    'wie houdt het actueel?',
    'wie kan het vinden?',
    'Dat helpt, maar context alleen verandert nog niets in je bedrijf. Bedrijfsgeheugen koppelt die context aan wat er buiten en binnen verandert, wat geraakt wordt, welke actie nodig is en wat het resultaat daarvan was.',
    'Bedrijfslek built-artifact contract: exact Netlify build must preserve this value-first route.'
  ];
  assert.equal(required.length,18);
  for(const source of required){
    assert.equal(typeof cache[source],'string',`missing translation: ${source}`);
    assert.ok(cache[source].trim().length>0,`empty translation: ${source}`);
  }
  const toml=fs.readFileSync('netlify.toml','utf8');
  assert.match(toml,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"1"/);
  assert.match(toml,/STATIC_I18N_NETWORK\s*=\s*"0"/);
});

test('Netlify production truth skill forbids deploy retry as cache recovery',()=>{
  const skill=fs.readFileSync(skillPath,'utf8');
  assert.match(skill,/netlify-static-i18n-cache-terminal-20260930-v1/);
  assert.match(skill,/Repeated deploy retries without completing the cache are prohibited/);
  assert.match(skill,/exact current-main production command chain/i);
  assert.match(skill,/netlify-static-i18n-final-artifact-zero-missing-20260930-v2/);
  assert.match(skill,/zero missing static English keys/i);
  assert.match(skill,/every translatable string selected by the canonical localized-route builder/i);
});
