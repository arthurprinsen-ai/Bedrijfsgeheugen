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
  const ai=fn.indexOf('https://api.openai.com/v1/chat/completions');
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

test('een Tavily-fout stopt de run zichtbaar en wordt niet als nul nieuws gelezen', () => {
  assert.ok(fn.includes('if (!r.ok) throw new Error(`TAVILY_${r.status}`)'));
  assert.ok(fn.includes("'REMOTE' : 'VALIDATION'"));
});

test('owner mandated OpenAI only for original news scoring',()=>{
  assert.ok(fn.includes("gov.provider !== 'OpenAI'"));
  assert.ok(fn.includes("geheim('OPENAI_API_KEY')"));
  assert.ok(!fn.includes('ANTHROPIC_API_KEY'));
  assert.ok(!fn.includes('api.anthropic.com'));
  assert.ok(fn.includes('INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1'));
});
test('OpenAI returns mandatory original function arguments and never invents valid output',()=>{
  assert.ok(fn.includes("name: 'oordeel'"));
  assert.ok(fn.includes("parameters: schema"));
  assert.ok(fn.includes("parallel_tool_calls: false"));
  assert.ok(fn.includes("message?.tool_calls"));
  assert.ok(fn.includes("OPENAI_TOOL_RESULT_MISSING"));
  assert.ok(fn.includes("OPENAI_OUTPUT_NOT_JSON"));
  assert.ok(fn.includes("OPENAI_OUTPUT_CONTRACT_FAILED"));
  assert.ok(fn.includes("Array.isArray(parsed.oordelen)"));
});
test('only suggested DM actions, never external transmissions',()=>{
  assert.ok(fn.includes("status: 'suggested'"));
  assert.ok(fn.includes("dms >= MAX_DM"));
  assert.ok(fn.includes("VERZONNEN.test(dmTekst)"));
  assert.ok(!fn.includes("send_dm("));
});
