import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('pricing and portal business-context vocabulary stay commercially aligned',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  const engine=await readFile(new URL('../brain/context/business-context-engine.mjs',import.meta.url),'utf8');
  for(const label of [
    'Start & validatie','Validatie & eerste tractie','Groei','Snelle groei / opschalen','Professionaliseren',
    'Volwassen & stabiel','Stagnatie','Verlies & herstel','Acute continuïteit',
    'Financiering ophalen','Bedrijf kopen','Bedrijf verkopen','Fusie','Post-merger integratie','Bedrijfsopvolging',
    'MBO / MBI','Internationaliseren','Herstructureren','Investeerder / portfolio',
    'Omzetgroei','Meer winst','Cash beschermen','Groei zonder extra FTE','Ondernemingswaarde verhogen',
    'Verkoop voorbereiden','Risico verlagen'
  ]){
    assert.ok(engine.includes(label),`engine: ${label}`);
    assert.ok(html.replaceAll('&amp;','&').includes(label),`pricing: ${label}`);
  }
  assert.match(html,/Je bedrijfsfase is niet je abonnement/i);
});

test('public tier promises stay within canonical SaaS entitlement boundaries',async()=>{
  const [html,migration]=await Promise.all([
    readFile(new URL('../prijzen.html',import.meta.url),'utf8'),
    readFile(new URL('../supabase/migrations/20260920101730_saas_checkout_entitlements_20260920.sql',import.meta.url),'utf8')
  ]);
  assert.match(migration,/\('control','forecasting','true'/);
  assert.match(migration,/\('control','scenario_analysis','true'/);
  assert.match(html,/Forecasting en scenarioanalyse op dagelijkse data/i);
  assert.match(migration,/\('scale','audit_trail','true'/);
  assert.match(html,/Audittrail op acties en goedkeuringen/i);
  assert.match(migration,/\('enterprise','organisations','25'/);
  assert.match(html,/SSO, meerdere organisaties en strengere governance/i);
});

test('yearly pricing is not display-only and reaches annual recurring checkout',async()=>{
  const [pricing,page,backend]=await Promise.all([
    readFile(new URL('../prijzen.html',import.meta.url),'utf8'),
    readFile(new URL('../afsluiten.html',import.meta.url),'utf8'),
    readFile(new URL('../netlify/functions/checkout-create.mjs',import.meta.url),'utf8')
  ]);
  assert.match(pricing,/searchParams\.set\('billing',billing\)/);
  assert.match(page,/name="billing_cycle"/);
  assert.match(page,/q\.get\('billing'\)==='yearly'/);
  assert.match(backend,/billing_cycle/);
  assert.match(backend,/Number\(plan\.monthly_price_cents\)\*10/);
  assert.match(backend,/billingCycle==='yearly'\?'year':'month'/);
});


test('pricing route examples are not mislabeled as the complete business-context taxonomy',async()=>{
  const html=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
  assert.match(html,/Veelvoorkomende commerciële routes/i);
  assert.match(html,/Dit is niet de volledige bedrijfscontext van Powerhouse/i);
  assert.doesNotMatch(html,/<p class="eyebrow">Kies je bedrijfssituatie<\/p>/i);
  assert.match(html,/aria-label="Veelvoorkomende commerciële routes"/i);
});
