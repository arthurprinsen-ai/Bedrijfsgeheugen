import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const requiredFingerprints = [
  'content|social-publication|expected-today-zero-eligible-candidates',
  'delivery-failure|integration|automation|bg184-bg156-invalid-event-envelope',
  'make|connector|account-connect-400',
  'delivery-failure|pipeline|seo|dirty-generated-report-blocked-rebase',
  'delivery-failure|writeback|shared|atomic-ledger-hardcoded-pr139-dedupe',
  'delivery-failure|deploy|shared|main-production-sha-lag',
  'delivery-failure|verification|shared|technical-success-without-outcome'
];

const requiredRules = [
  'RECOVER_DUE_SOCIAL_ZERO_CANDIDATES_FROM_RELEASE_STATE',
  'VALIDATE_BG184_BG156_EVENT_ENVELOPE',
  'TREAT_MAKE_ACCOUNT_CONNECT_400_AS_HARD_BOUNDARY',
  'RESTORE_GENERATED_REPORT_BEFORE_REBASE',
  'DEDUPE_LEDGER_BY_EVENT_FINGERPRINT_NOT_HARDCODED_PR',
  'RECONCILE_MAIN_TO_EXACT_PRODUCTION_SHA',
  'REQUIRE_OUTCOME_EVIDENCE_BEFORE_GREEN'
];

test('all chat-proven operational failures are persisted as reusable prevention knowledge', async () => {
  const lessons = JSON.parse(await readFile('docs/brain/delivery-failure-lessons.json', 'utf8'));
  const rules = JSON.parse(await readFile('config/delivery-prevention-rules.json', 'utf8'));

  const lessonFingerprints = new Set(lessons.lessons.map(x => x.fingerprint));
  const preventionRules = new Set(rules.rules.filter(x => x.active).map(x => x.id));

  for (const fingerprint of requiredFingerprints) {
    assert.ok(lessonFingerprints.has(fingerprint), `missing chat lesson fingerprint: ${fingerprint}`);
  }

  for (const rule of requiredRules) {
    assert.ok(preventionRules.has(rule), `missing active prevention rule: ${rule}`);
  }
});
