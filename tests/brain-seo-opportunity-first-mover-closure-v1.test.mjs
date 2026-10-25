import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import './supabase-powerhouse-seo-opportunity-resolver-v1.test.mjs';

test('SEO opportunity resolver is a registered required quality surface',()=>{
  const registry=JSON.parse(fs.readFileSync('config/powerhouse-quality-surface-contracts.json','utf8'));
  const surface=registry.surfaces.find(x=>x.id==='function:powerhouse-seo-opportunity-resolver');
  assert.ok(surface,'resolver quality surface must be registered');
  assert.equal(surface.required,true);
  assert.equal(surface.authority,'supabase/functions/powerhouse-seo-opportunity-resolver/index.ts');
  assert.equal(surface.evidence_contract,'tests/brain-seo-opportunity-first-mover-closure-v1.test.mjs');
});


test('commercial aliases remain owned by the existing Exact Online money page',()=>{
  const owners=JSON.parse(fs.readFileSync('supabase/functions/powerhouse-seo-opportunity-resolver/intent-owners.json','utf8'));
  const page=owners.pages.find(x=>x.route==='https://www.bedrijfsgeheugen.nl/exact-online-koppeling');
  assert.ok(page);
  assert.ok(page.secondary_keywords.includes('exact online api'));
});
