import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../supabase/functions/bg-experimentcyclus/index.ts', import.meta.url),'utf8');
test('original experiment source preserves daily owner and avoids another scheduler',()=>{
  assert.ok(source.includes("const BRON = 'bg-experimentcyclus'"));
  assert.ok(source.includes("const USE_CASE = 'supabase-bg-experimentcyclus-v1'"));
  assert.ok(source.includes("MIN_BEZOEKERS = 150"));
  assert.ok(source.includes("bg_experimentcyclus_poort"));
  assert.ok(source.includes("INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1"));
  assert.ok(!source.includes("cron.schedule"));
});
test('only specifically approved OpenAI provider and secret are accepted',()=>{
  assert.ok(source.includes("gov.provider !== 'OpenAI'"));
  assert.ok(source.includes("p_naam: 'OPENAI_API_KEY'"));
  assert.ok(!source.includes("ANTHROPIC_API_KEY"));
  const match=source.match(/const ai = await fetch\('([^']+)'/);
  assert.ok(match);
  const endpoint=new URL(match[1]);
  assert.equal(endpoint.origin,'https://api.openai.com');
  assert.equal(endpoint.pathname,'/v1/chat/completions');
});
test('original named experiment schema is forced and parsed without client hallucinations',()=>{
  for(const key of ['voorstel', 'tool_choice:', 'parallel_tool_calls: false', 'message?.tool_calls',
    'OPENAI_TOOL_RESULT_MISSING','OPENAI_OUTPUT_NOT_JSON',
    'VOORSTEL_ONBEKENDE_PAGINA_OR_SCHEMA','schema.required.some'])
    assert.ok(source.includes(key),key);
  assert.ok(source.includes('paginas.some((p: any) => p.pad === v.pagina)'));
});
test('experimental traffic gates and human decision stay enforced',()=>{
  assert.ok(source.includes('if (lopend.length)'));
  assert.ok(source.includes('if (bezoekers < MIN_BEZOEKERS)'));
  assert.ok(source.includes("poort('beoordelen')"));
  assert.ok(source.includes("poort('data')"));
  assert.ok(source.includes("poort('voorstellen', v)"));
  assert.ok(source.includes("bg_bewijs"));
  assert.ok(!source.includes("send_dm("));
});
