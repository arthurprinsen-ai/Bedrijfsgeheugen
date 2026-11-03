import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const migration=readFileSync(new URL('../supabase/migrations/20261103143000_bg_experimentcyclus_regex_started_at_contract_v1.sql',import.meta.url),'utf8');
const edge=readFileSync(new URL('../supabase/functions/bg-experimentcyclus/index.ts',import.meta.url),'utf8');
test('Postgres guard never repeats invalid >255 regex quantifier and retains 300-character path cap',()=>{
  assert.doesNotMatch(migration,/\{0,299\}/);
  assert.match(migration,/char_length\(v_pagina\) > 300/);
  assert.match(migration,/\[\^\?#\[:space:\]\]\*/);
  assert.match(migration,/ONGELDIG_VOORSTEL/);
});
test('Experiment proposal insert respects existing NOT NULL started_at without activating unapproved experiments',()=>{
  assert.match(migration,/status, started_at, created_at, updated_at/);
  assert.match(migration,/'PLANNED', now\(\), now\(\), now\(\)/);
  assert.match(migration,/bg_experimentcyclus_poort/);
  assert.match(migration,/SECURITY DEFINER/);
  assert.match(migration,/SET search_path TO ''/);
  assert.doesNotMatch(migration,/DROP TABLE|ALTER TABLE.*DROP|cron\.schedule/i);
});
test('Original OpenAI owner, evidence and manual approval gate remain unchanged',()=>{
  assert.match(edge,/gov\.provider !== 'OpenAI'/);
  assert.match(edge,/MIN_BEZOEKERS = 150/);
  assert.match(edge,/poort\('beoordelen'\)/);
  assert.match(edge,/poort\('voorstellen', v\)/);
  assert.match(edge,/bg_bewijs/);
  assert.doesNotMatch(edge,/ANTHROPIC_API_KEY/);
});
