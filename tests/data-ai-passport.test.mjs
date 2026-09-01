import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PASSPORT_STATUSES,
  normalizePassportControl,
  buildDataAiPassport,
  buildPassportFromState,
} from '../portal/data-ai-passport.mjs';
import { renderDataAiPassport } from '../portal/data-ai-passport-view.mjs';

const DELIVERY_CONFIG = new URL('../config/brain-delivery-system.json', import.meta.url);

test('passport never marks an unverified claim as verified', () => {
  const control = normalizePassportControl({
    id: 'data-residency',
    label: 'Data residency',
    claim: 'EU only',
    evidence: [],
  });

  assert.equal(control.status, 'unknown');
  assert.equal(control.verified, false);
  assert.equal(control.claim, 'EU only');
});

test('verified requires explicit verified evidence', () => {
  const control = normalizePassportControl({
    id: 'model-register',
    label: 'Model register',
    evidence: [{ id: 'E-1', verified: true, confidence: 95, source: 'AI register' }],
  });

  assert.equal(control.status, 'verified');
  assert.equal(control.verified, true);
});

test('mixed evidence becomes partially_verified', () => {
  const control = normalizePassportControl({
    id: 'dpia',
    label: 'DPIA coverage',
    evidence: [
      { id: 'E-1', verified: true, confidence: 91 },
      { id: 'E-2', verified: false, confidence: 60 },
    ],
  });

  assert.equal(control.status, 'partially_verified');
  assert.equal(control.verified, false);
});

test('explicit unresolved issue becomes action_required', () => {
  const control = normalizePassportControl({
    id: 'human-oversight',
    label: 'Human oversight',
    issue: 'No owner assigned',
    evidence: [{ id: 'E-1', verified: true, confidence: 90 }],
  });

  assert.equal(control.status, 'action_required');
});

test('passport summary is conservative and evidence based', () => {
  const passport = buildDataAiPassport({
    controls: [
      { id: 'a', label: 'A', evidence: [{ id: '1', verified: true, confidence: 90 }] },
      { id: 'b', label: 'B', evidence: [] },
      { id: 'c', label: 'C', issue: 'Owner missing', evidence: [{ id: '2', verified: true, confidence: 90 }] },
    ],
  });

  assert.deepEqual(PASSPORT_STATUSES, ['verified','partially_verified','unknown','action_required']);
  assert.equal(passport.summary.total, 3);
  assert.equal(passport.summary.verified, 1);
  assert.equal(passport.summary.unknown, 1);
  assert.equal(passport.summary.actionRequired, 1);
  assert.equal(passport.summary.coveragePct, 33);
  assert.equal(passport.complianceClaim, 'evidence-status-only');
});

test('empty tenant state yields unknown defaults rather than green compliance', () => {
  const passport = buildPassportFromState({});
  assert.ok(passport.summary.total >= 8);
  assert.equal(passport.summary.verified, 0);
  assert.equal(passport.summary.unknown, passport.summary.total);
});

test('visible passport explicitly disclaims certification', () => {
  const html = renderDataAiPassport({});
  assert.match(html, /geen juridisch certificaat/i);
  assert.match(html, /Nog te bewijzen/);
  assert.doesNotMatch(html, /100%.*compliant/i);
});

test('delivery classifier owns the passport regression path', async () => {
  const config = JSON.parse(await readFile(DELIVERY_CONFIG, 'utf8'));
  const portal = config.lanes.find(lane => lane.id === 'portal');
  assert.ok(portal, 'portal delivery lane must exist');
  assert.ok(
    portal.paths.some(prefix => 'tests/data-ai-passport.test.mjs'.startsWith(prefix)),
    'Data & AI Passport regression tests must be classified in the portal delivery lane',
  );
});
