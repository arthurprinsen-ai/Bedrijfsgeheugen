import test from 'node:test';
import assert from 'node:assert/strict';
import { checkInvariants } from '../brain/observability/invariants.mjs';

const now = '2026-08-30T14:00:00.000Z';
const heartbeat = { id: 'hb-1', object_type: 'HEARTBEAT', created_at: now };

test('required external platform controls become BRAIN invariant violations when unenforced', () => {
  const result = checkInvariants({
    events: [heartbeat],
    currentStates: [],
    now,
    platformControls: [
      { id: 'github-main-protection', required: true, enforced: false, severity: 'critical', evidence_ref: 'github:main' },
      { id: 'supabase-leaked-password-protection', required: true, enforced: false, severity: 'high', evidence_ref: 'supabase:security-advisor' }
    ]
  });

  assert.equal(result.healthy, false);
  assert.deepEqual(result.violations.map(v => v.code), [
    'EXTERNAL_PLATFORM_CONTROL_RED',
    'EXTERNAL_PLATFORM_CONTROL_RED'
  ]);
  assert.deepEqual(result.violations.map(v => v.control_id), [
    'github-main-protection',
    'supabase-leaked-password-protection'
  ]);
  assert.equal(result.recovery_signals.every(s => s.signal_type === 'OPERATIONAL_INVARIANT_VIOLATION'), true);
});

test('green or optional external controls do not create violations', () => {
  const result = checkInvariants({
    events: [heartbeat],
    currentStates: [],
    now,
    platformControls: [
      { id: 'github-main-protection', required: true, enforced: true },
      { id: 'optional-control', required: false, enforced: false }
    ]
  });
  assert.equal(result.healthy, true);
  assert.equal(result.violations.length, 0);
});

test('external control observations fail closed when a required control has no enforced state', () => {
  const result = checkInvariants({
    events: [heartbeat],
    currentStates: [],
    now,
    platformControls: [{ id: 'github-main-protection', required: true }]
  });
  assert.equal(result.healthy, false);
  assert.equal(result.violations[0].code, 'EXTERNAL_PLATFORM_CONTROL_UNKNOWN');
  assert.equal(result.violations[0].severity, 'critical');
});
