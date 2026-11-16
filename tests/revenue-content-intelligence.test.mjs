import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rankOpportunities,
  chooseDecisionMode,
  buildCreativeRecipe,
  buildExperimentCalendar
} from '../brain/creative/revenue-content-intelligence.mjs';

test('ranks order/revenue opportunity above a high-reach low-intent signal', () => {
  const ranked = rankOpportunities([
    { id:'viral', reach:100000, intent:0.05, evidence:0.8, expectedRevenue:0 },
    { id:'buyer', reach:500, intent:0.9, evidence:0.8, expectedRevenue:2900, urgency:0.8 }
  ]);
  assert.equal(ranked[0].id, 'buyer');
});

test('rewards latent-problem activation and fomo when commercial evidence is comparable', () => {
  const ranked = rankOpportunities([
    { id:'plain', intent:0.5, evidence:0.7, expectedRevenue:1000 },
    { id:'latent', intent:0.5, evidence:0.7, expectedRevenue:1000, painActivation:0.9, fomo:0.8 }
  ]);
  assert.equal(ranked[0].id, 'latent');
});

test('keeps exploration near the configured twenty percent target', () => {
  assert.equal(chooseDecisionMode(['EXPLOIT','EXPLOIT','EXPLOIT','EXPLOIT'], 0.2), 'EXPLORE');
  assert.equal(chooseDecisionMode(['EXPLORE','EXPLOIT','EXPLOIT','EXPLOIT','EXPLOIT'], 0.2), 'EXPLOIT');
});

test('personal creative recipe cannot turn a commercial opportunity into an Arthur story', () => {
  const recipe = buildCreativeRecipe({ channel:'linkedin_personal', opportunity:{ topic:'Excel dependency', pain:'single point of knowledge' }, mode:'EXPLORE' });
  assert.equal(recipe.textType, 'verified_first_person_personal_life_story');
  assert.equal(recipe.sourceContract, 'personal-linkedin-personal-life-only-v1');
  assert.equal(recipe.requiresVerifiedUserFact, true);
  assert.equal(recipe.topic, null);
  assert.equal(recipe.objective, 'authentic_personal_conversation');
  assert.equal(recipe.narrativeShape, 'source_determined');
  assert.equal(recipe.mandatoryQuestion, false);
  assert.equal('ctaType' in recipe, false);
  assert.equal('offerType' in recipe, false);
  assert.equal('discoveryQuestion' in recipe, false);
  assert.equal('fomoTrigger' in recipe, false);
  assert.equal('behavioralLever' in recipe, false);
  assert.ok(recipe.guardrails.includes('no_business_bridge'));
  assert.ok(recipe.guardrails.includes('no_private_chat_as_public_permission'));
});

test('builds company recipe around proof, carousel/education and offer ladder', () => {
  const recipe = buildCreativeRecipe({ channel:'linkedin_company', opportunity:{ topic:'knowledge risk' }, mode:'EXPLOIT' });
  assert.ok(['carousel','case_proof','diagnostic'].includes(recipe.format));
  assert.ok(recipe.offerType);
  assert.equal(recipe.objective, 'qualified_demand');
});

test('calendar covers every date from 12 September through 31 December without freezing final copy', () => {
  const calendar = buildExperimentCalendar({ start:'2026-09-12', end:'2026-12-31' });
  assert.equal(calendar[0].date, '2026-09-12');
  assert.equal(calendar.at(-1).date, '2026-12-31');
  assert.equal(calendar.length, 111);
  assert.ok(calendar.every(x => x.experimentId && x.personal && x.company));
  assert.ok(calendar.every(x => !('text' in x.personal) && !('text' in x.company)));
});


test('commercial activation psychology remains exclusive to company recipes', () => {
  const recipe = buildCreativeRecipe({ channel:'linkedin_company', opportunity:{ topic:'kennisverlies', buyingSituation:'sleutelmedewerker vertrekt' }, mode:'EXPLORE', seed:'activation' });
  assert.equal(recipe.awarenessStage, 'UNAWARE');
  assert.ok(recipe.behavioralLever);
  assert.equal(recipe.categoryEntryPoint, 'sleutelmedewerker vertrekt');
  assert.ok(recipe.persuasionGuardrails.includes('no_fake_scarcity'));
  assert.ok(recipe.persuasionGuardrails.includes('no_fake_social_proof'));
});

test('opportunity ranking can reward category-entry-point fit, proof and friction reduction', () => {
  const ranked = rankOpportunities([
    { id:'generic', intent:.5, evidence:.5, expectedRevenue:1000 },
    { id:'behavioral', intent:.5, evidence:.5, expectedRevenue:1000, categoryEntryPointFit:1, mentalAvailability:1, proofStrength:1, frictionReduction:1 }
  ]);
  assert.equal(ranked[0].id, 'behavioral');
});

test('calendar rotates behavioral-science experiments and preserves ethical guardrails', () => {
  const calendar = buildExperimentCalendar({ start:'2026-09-12', end:'2026-09-25' });
  assert.ok(calendar.some(x => ['category_entry_point','mental_availability','social_proof','loss_framing','friction_reduction','distinctive_asset'].includes(x.experimentFamily)));
  assert.ok(calendar.every(x => x.personal.sourceContract === 'personal-linkedin-personal-life-only-v1' && x.company.behavioralLever && x.blog.persuasionGuardrails.includes('no_deceptive_dark_patterns')));
});

test('calendar never manufactures personal posts from B2B experiment families', () => {
  const calendar = buildExperimentCalendar({ start:'2026-11-16', end:'2026-11-22' });
  assert.equal(calendar.length, 7);
  assert.ok(calendar.every(row => row.personal.topic === null));
  assert.ok(calendar.every(row => row.personal.requiresVerifiedUserFact === true));
  assert.ok(calendar.every(row => !('offerType' in row.personal)));
});

test('personal learning configuration rejects commercial objectives and unproven winner claims', async () => {
  const {readFileSync} = await import('node:fs');
  const cfg = JSON.parse(readFileSync(new URL('../config/social-learning-engine.json',import.meta.url),'utf8'));
  const personal = cfg.creativePolicy.personalLinkedIn;
  assert.equal(personal.defaultTextType, 'verified_first_person_personal_life_story');
  assert.equal(personal.verifiedUnusedUserFactRequired, true);
  assert.equal(personal.commercialConversionOptimizationForbidden, true);
  assert.equal(personal.promoteWinnerOnlyWithIndependentPersonalMetrics, true);
  assert.equal(personal.insufficientMetricsOutcome, 'NOT_MEASURED');
  assert.equal(cfg.creativePolicy.companyLinkedIn.objective, 'qualified_demand');
});
