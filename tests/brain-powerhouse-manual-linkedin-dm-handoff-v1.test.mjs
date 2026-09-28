import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync('intern/vandaag/index.html','utf8');
const fn=fs.readFileSync('supabase/functions/bg-dagoverzicht/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20260928162500_bg_vandaag_manual_dm_handoff_v1.sql','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-manual-sales-handoff/SKILL.md','utf8');

test('Arthur Actions only renders irreducibly manual sales work',()=>{
  assert.match(ui,/filter\(function\(i\)\{return i\.handmatig_nodig===true;\}\)/);
  assert.match(ui,/LinkedIn DM handmatig versturen/);
  assert.match(ui,/STUUR DEZE DM/);
  assert.match(ui,/Open LinkedIn-profiel/);
});

test('manual DM card exposes connection, value and outcome controls',()=>{
  assert.match(ui,/connectie_status/);
  assert.match(ui,/verwachte_waarde_eur/);
  assert.match(ui,/data-soort="executed"/);
  assert.match(ui,/data-soort="defer"/);
  assert.match(ui,/data-soort="not_relevant"/);
});

test('Powerhouse creates the PDF instead of delegating creation to the user',()=>{
  assert.match(fn,/PDFDocument/);
  assert.match(fn,/createSalesPdf/);
  assert.match(ui,/data-pdf/);
  assert.match(ui,/PDF wordt door Powerhouse gemaakt/);
  assert.match(skill,/A missing PDF is a Powerhouse failure/i);
});

test('database projection never invents direct connection evidence',()=>{
  assert.match(migration,/Connectie niet geverifieerd/);
  assert.match(migration,/handmatig_nodig/);
  assert.match(migration,/pdf_nodig/);
});


test('quality registry contains the handoff runtime surfaces',()=>{
  const registry=JSON.parse(fs.readFileSync('config/powerhouse-quality-surface-contracts.json','utf8'));
  const ids=new Set((registry.surfaces||[]).map(x=>x.id));
  assert.ok(ids.has('function:bg-dagoverzicht'));
  assert.ok(ids.has('rpc:bg_uitkomst_vastleggen'));
  assert.ok(ids.has('view:public.bg_vandaag'));
});
