import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalEditorialViolations} from '../supabase/functions/_shared/personal-linkedin-editorial-contract.mjs';
const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
test('original personal builder removes the conflicting model/page/action status-dump directive',()=>{
  assert.doesNotMatch(source,/Gebruik journey_snapshot om in gewone taal te laten zien wat er inmiddels aantoonbaar staat en gebeurt: bijvoorbeeld hoeveel AI-modellen/);
  assert.match(source,/Gebruik journey_snapshot uitsluitend als interne feitelijke bron/);
  assert.match(source,/Schrijf 150–175 gewone Nederlandse woorden/);
  assert.match(source,/Begin direct met een herkenbaar probleem bij een ondernemer of bedrijf/);
  assert.match(source,/in precies vier korte alinea’s/);
  assert.match(source,/als geen geloofwaardig eigen nieuw feit bestaat, verzin niets/);
});
test('the original strict uniqueness, personal source, protected rights and editorial validator remain intact',()=>{
  assert.match(source,/personalEditorialViolations/);
  assert.match(source,/recoverableObligationUniquenessDenial/);
  assert.match(source,/personalSource/);
  assert.match(source,/consumedCapabilityChannels/);
  assert.match(source,/PERSONAL_EDITORIAL_POLICY/);
  assert.doesNotMatch(source,/DISABLE_DUPLICATE_GATE|IGNORE_PERSONAL_EDITORIAL/);
});
test('real personal editorial veto rejects statusdump, non-buyer opening and excessive draft',()=>{
  const bad='Ik wil dat AI meer doet. Vandaag 273 pagina’s, 30 bronnen en 280 acties. Wij sturen statusrapporten. Hoe kijk jij hiernaar?';
  const violations=personalEditorialViolations(bad,{ai_native_builder_story_verified:true});
  const codes=violations.map(x=>x.code);
  assert.ok(codes.includes('PERSONAL_EDITORIAL_WORD_COUNT'));
  assert.ok(codes.includes('PERSONAL_EDITORIAL_GENERIC_AI_HOOK'));
  assert.ok(codes.includes('PERSONAL_EDITORIAL_INTERNAL_METRICS_REPORT'));
});
