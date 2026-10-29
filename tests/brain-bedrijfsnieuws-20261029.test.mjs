import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Contracttest voor de herstelde broncode van bg-bedrijfsnieuws (v10).
// Legt de grenzen vast: governance eerst, DM-filters, zekerheidsdrempel, dagmaximum.
// Test geen Tavily-gedrag; dat wordt in de eigen fix-PR getest.
const fn=readFileSync(new URL('../supabase/functions/bg-bedrijfsnieuws/index.ts',import.meta.url),'utf8');

test('governance-poort staat voor elke externe aanroep', ()=>{
  const poort=fn.indexOf('AI_USE_CASE_NOT_APPROVED');
  const tavily=fn.indexOf('https://api.tavily.com/search');
  const ai=fn.indexOf('https://api.anthropic.com/v1/messages');
  assert.ok(poort>0 && tavily>poort);
  assert.ok(ai>poort);
});

test('DM-filters blokkeren verzonnen ervaringen, links en te veel DM per dag', ()=>{
  assert.ok(fn.includes('verzonnen ervaring in DM'));
  assert.ok(fn.includes('link in DM'));
  assert.ok(fn.includes('dagmaximum bereikt'));
  assert.ok(fn.includes('MAX_DM = 3'));
});

test('zekerheidsdrempel en venster blijven zoals ontworpen', ()=>{
  assert.ok(fn.includes('MIN_ZEKERHEID = 0.8'));
  assert.ok(fn.includes('DAGEN = 60'));
});

test('persoonlijk nieuws en overig krijgen nooit een DM', ()=>{
  assert.ok(fn.includes("['persoonlijk', 'overig'].includes(o.soort)"));
});

test('sociale media en vacatureboards tellen niet als bron', ()=>{
  assert.ok(fn.includes('SOCIAAL'));
});
