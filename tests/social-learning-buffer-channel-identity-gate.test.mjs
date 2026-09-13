import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNELS, authorizeSocialPublication } from '../platform/social-channel-identity-gate.mjs';

const lineage = {
  contentId: 'li-personal-2026-09-13-a',
  calendarDate: '2026-09-13',
  predictionId: 'prediction-li-personal-2026-09-13-a',
  sourceDecisionId: 'decision-li-personal-2026-09-13-a'
};
const grounded = (klass = 'author_observation') => ({ class: klass, verified: true, evidenceRefs: ['chat:2026-09-13:arthur-grounding'] });

test('canonical Buffer identities are immutable and exact', () => {
  assert.equal(CHANNELS.linkedin_personal.channelId, '6a70381699afb44349f0fb35');
  assert.equal(CHANNELS.linkedin_company.channelId, '6a70381699afb44349f0fb36');
  assert.equal(CHANNELS.instagram_company.channelId, '6a70384d99afb44349f0fba9');
});

test('Arthur personal LinkedIn allows only grounded non-interchangeable personal copy', () => {
  const result = authorizeSocialPublication({
    channelKind: 'linkedin_personal', channelId: CHANNELS.linkedin_personal.channelId,
    text: 'Ik merk dat digitalisering vaak pas aandacht krijgt als het handwerk echt begint te knellen. Voor mij is dat het moment om te kijken waar kennis blijft hangen.',
    personalTruth: grounded(), companyPageInterchangeable: false, lineage
  });
  assert.equal(result.authorized, true);
});

test('corporate consultant copy is blocked on Arthur personal LinkedIn', () => {
  const result = authorizeSocialPublication({
    channelKind: 'linkedin_personal', channelId: CHANNELS.linkedin_personal.channelId,
    text: 'Wij helpen organisaties hun digitale transformatie te versnellen met data, AI en bewezen frameworks. Neem contact op voor een vrijblijvend gesprek.',
    lineage, personalTruth: grounded(), companyPageInterchangeable: true
  });
  assert.equal(result.authorized, false);
  assert.ok(result.reasons.includes('PERSONAL_ANCHOR_REQUIRED'));
  assert.ok(result.reasons.includes('CORPORATE_VOICE_ON_PERSONAL'));
});

test('adding a token first-person phrase does not rescue corporate copy', () => {
  const result = authorizeSocialPublication({
    channelKind: 'linkedin_personal', channelId: CHANNELS.linkedin_personal.channelId,
    text: 'Ik denk dat onze aanpak sterk is. Wij helpen organisaties met data en AI. Neem contact op voor een vrijblijvend gesprek.',
    lineage, personalTruth: grounded('author_opinion'), companyPageInterchangeable: true
  });
  assert.equal(result.authorized, false);
  assert.ok(result.reasons.includes('CORPORATE_VOICE_ON_PERSONAL'));
  assert.ok(result.reasons.includes('COMPANY_PAGE_INTERCHANGEABLE_NOT_REJECTED'));
});

test('wrong Buffer channel is fail-closed even when copy itself is personal', () => {
  const result = authorizeSocialPublication({
    channelKind: 'linkedin_personal', channelId: CHANNELS.linkedin_company.channelId,
    text: 'Ik zie dit steeds terug in mijn werk.', personalTruth: grounded(), companyPageInterchangeable: false, lineage
  });
  assert.equal(result.authorized, false);
  assert.ok(result.reasons.includes('CHANNEL_IDENTITY_MISMATCH'));
});

test('every personal truth class needs evidence refs and verified=true', () => {
  const result = authorizeSocialPublication({
    channelKind: 'linkedin_personal', channelId: CHANNELS.linkedin_personal.channelId,
    text: 'Ik vind dat automatiseren pas zin heeft als je weet welk probleem je oplost.',
    personalTruth: { class: 'author_opinion', verified: false, evidenceRefs: [] }, companyPageInterchangeable: false, lineage
  });
  assert.equal(result.authorized, false);
  assert.ok(result.reasons.includes('FIRST_PERSON_EVIDENCE_REQUIRED'));
  assert.ok(result.reasons.includes('FIRST_PERSON_TRUTH_UNVERIFIED'));
});

test('missing prediction/content lineage blocks publication', () => {
  const result = authorizeSocialPublication({
    channelKind: 'linkedin_personal', channelId: CHANNELS.linkedin_personal.channelId,
    text: 'Ik vind dat automatiseren pas zin heeft als je weet welk probleem je oplost.',
    personalTruth: grounded('author_opinion'), companyPageInterchangeable: false, lineage: { contentId: 'x' }
  });
  assert.equal(result.authorized, false);
  assert.ok(result.reasons.includes('LINEAGE_INCOMPLETE'));
});

test('Mira content cannot be routed to Arthur personal LinkedIn', () => {
  const result = authorizeSocialPublication({
    channelKind: 'instagram_company', channelId: CHANNELS.linkedin_personal.channelId,
    text: 'Mira opent haar laptop. Vier updates. Nul koffie.', miraGatePassed: true, lineage
  });
  assert.equal(result.authorized, false);
  assert.ok(result.reasons.includes('CHANNEL_IDENTITY_MISMATCH'));
});
