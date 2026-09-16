import test from 'node:test';
import assert from 'node:assert/strict';
import bufferCollect, { config, runBufferCollection } from '../netlify/functions/buffer-social-collect.mjs';
import {
  hasProviderCoverage,
  selectDeliverySource,
  deliveryDecision,
} from '../platform/social-delivery-guarantee.mjs';

test('Buffer collector is scheduled natively and not through Make', () => {
  assert.equal(config.schedule, '15 */6 * * *');
});

test('missing Buffer credential records one fail-closed obligation', async () => {
  const obligations=[];
  const store={recordObligation:async obligation=>obligations.push(obligation)};
  const result=await runBufferCollection({apiKey:null,store,now:new Date('2026-09-09T10:00:00Z')});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'BUFFER_API_KEY_REQUIRED');
  assert.equal(obligations.length,1);
  assert.equal(obligations[0].id,'buffer-social-learning:credential');
});

test('scheduled handler returns 503 when credential is absent instead of false green', async () => {
  const response=await bufferCollect({apiKey:null,store:{recordObligation:async()=>{}}});
  assert.equal(response.status,503);
});

const personalArtifact = {
  channel: 'linkedin_personal',
  artifact_type: 'linkedin_post',
  body: 'Vanochtend keek ik in Buffer. Leeg.',
  status: 'content_ready',
  generation_evidence: {
    identity_gate_result: 'PASS',
    concrete_personal_anchor: true,
    corporate_style: false,
    personal_truth_verified: true,
  },
};

test('a Buffer Idea never counts as provider delivery coverage', () => {
  assert.equal(hasProviderCoverage({ ideas: [{ id: 'idea-1' }], posts: [] }), false);
});

test('scheduled, sending or sent provider records count as delivery coverage', () => {
  for (const status of ['scheduled', 'sending', 'sent']) {
    assert.equal(hasProviderCoverage({ posts: [{ status }] }), true);
  }
  assert.equal(hasProviderCoverage({ posts: [{ status: 'draft' }] }), false);
});

test('personal LinkedIn never publishes from a Buffer Idea', () => {
  const source = selectDeliverySource({
    channel: 'linkedin_personal',
    artifact: null,
    idea: { id: 'idea-personal', content: { text: 'generic personal seed' } },
  });
  assert.equal(source, null);
});

test('personal LinkedIn uses exact canonical PASS artifact body', () => {
  const source = selectDeliverySource({
    channel: 'linkedin_personal',
    artifact: personalArtifact,
    idea: { id: 'idea-personal', content: { text: 'different text' } },
  });
  assert.equal(source.kind, 'artifact');
  assert.equal(source.text, personalArtifact.body);
  assert.equal(source.ideaId, null);
});

test('personal LinkedIn fails closed when personal truth evidence is incomplete', () => {
  const artifact = structuredClone(personalArtifact);
  artifact.generation_evidence.personal_truth_verified = false;
  assert.equal(selectDeliverySource({ channel: 'linkedin_personal', artifact }), null);
});

test('Instagram fails closed without a verified final media asset', () => {
  const decision = deliveryDecision({
    channel: 'instagram',
    posts: [],
    artifact: { body: 'caption', generation_evidence: { media_gate_result: 'PASS' } },
    idea: { id: 'idea-instagram', content: { text: 'caption', media: [] } },
  });
  assert.equal(decision.action, 'BLOCK');
  assert.equal(decision.reason, 'FINAL_MEDIA_REQUIRED');
});

test('existing provider coverage dedupes before any create action', () => {
  const decision = deliveryDecision({
    channel: 'linkedin_company',
    posts: [{ id: 'post-1', status: 'scheduled' }],
    idea: { id: 'idea-company', content: { text: 'company copy' } },
  });
  assert.equal(decision.action, 'NONE');
  assert.equal(decision.reason, 'PROVIDER_COVERED');
});
