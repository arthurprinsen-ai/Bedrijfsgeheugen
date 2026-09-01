import { createDataAiPassport } from './data-ai-passport.mjs';

const MAKE_PLATFORM_EVIDENCE = Object.freeze({
  type: 'platform-inspection',
  source: 'Make environment',
  reference: 'make-env-8354941-team-2138086',
  checkedAt: '2026-09-01T19:56:00.000Z',
});

export function buildPlatformPassport({ company = {}, user = {}, persisted = null } = {}) {
  if (persisted && typeof persisted === 'object') return createDataAiPassport(persisted);
  return createDataAiPassport({
    tenantId: user.tenant || null,
    tenantName: company.name || null,
    ownership: {
      owner: company.name || null,
      controller: company.name || null,
      roleNote: 'Klantorganisatie; privacyrol kan per verwerking verschillen.',
      requestedStatus: company.name ? 'configured' : 'needs_evidence',
    },
    automation: [{
      provider: 'Make',
      role: 'orchestrator',
      zone: 'eu1.make.com',
      state: 'paused',
      scenarioIds: [7065224, 7065188],
      requestedStatus: 'verified',
      evidence: [MAKE_PLATFORM_EVIDENCE],
    }],
    assertions: {
      allDataWithinEer: {
        value: null,
        requestedStatus: 'needs_evidence',
        evidence: [],
      },
    },
  });
}
