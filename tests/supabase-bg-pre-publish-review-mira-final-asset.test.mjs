import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMiraFinalAssetEvidence } from '../supabase/functions/bg-pre-publish-review/mira-final-asset-gate.mjs';

const NOW = Date.parse('2026-09-17T08:45:00Z');
const ASSET = 'https://cdn.openart.ai/final-mira-video.mp4';
const ROW = 'instagram-2026-09-17';

function verified(overrides = {}) {
  return {
    record_id: 'mira-proof-2026-09-17',
    status: 'VERIFIED',
    verified: true,
    updated_at: '2026-09-17T08:30:00Z',
    payload: {
      channel: 'instagram_company',
      final_asset_url: ASSET,
      calendar_row_id: ROW,
      ...overrides.payload,
    },
    result: {
      decision: 'PASS',
      identity: 'Mira',
      exact_final_asset: true,
      ...overrides.result,
    },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => !['payload','result'].includes(key))),
  };
}

test('caller boolean alone can never prove Mira final asset', () => {
  const violations = validateMiraFinalAssetEvidence({
    gatePassed: true,
    finalAssetUrl: ASSET,
    calendarRowId: ROW,
    evidenceRecordId: '',
    evidenceRecord: null,
    nowMs: NOW,
  });
  assert.ok(violations.some((x) => x.code === 'MIRA_EVIDENCE_RECORD_REQUIRED'));
});

test('Mira evidence must bind the exact final asset and calendar row', () => {
  const wrongAsset = validateMiraFinalAssetEvidence({
    gatePassed: true,
    finalAssetUrl: ASSET,
    calendarRowId: ROW,
    evidenceRecordId: 'mira-proof-2026-09-17',
    evidenceRecord: verified({ payload: { final_asset_url: 'https://cdn.openart.ai/other.mp4' } }),
    nowMs: NOW,
  });
  assert.ok(wrongAsset.some((x) => x.code === 'MIRA_FINAL_ASSET_MISMATCH'));

  const wrongRow = validateMiraFinalAssetEvidence({
    gatePassed: true,
    finalAssetUrl: ASSET,
    calendarRowId: ROW,
    evidenceRecordId: 'mira-proof-2026-09-17',
    evidenceRecord: verified({ payload: { calendar_row_id: 'instagram-2026-09-16' } }),
    nowMs: NOW,
  });
  assert.ok(wrongRow.some((x) => x.code === 'MIRA_CALENDAR_ROW_MISMATCH'));
});

test('Mira evidence must be verified, explicit PASS, exact-final and fresh', () => {
  for (const [record, code] of [
    [verified({ verified: false }), 'MIRA_EVIDENCE_NOT_VERIFIED'],
    [verified({ result: { decision: 'BLOCK' } }), 'MIRA_EVIDENCE_NOT_PASS'],
    [verified({ result: { exact_final_asset: false } }), 'MIRA_EXACT_FINAL_ASSET_NOT_PROVEN'],
    [verified({ result: { identity: 'Other' } }), 'MIRA_IDENTITY_NOT_PROVEN'],
    [verified({ updated_at: '2026-09-15T00:00:00Z' }), 'MIRA_EVIDENCE_STALE'],
  ]) {
    const violations = validateMiraFinalAssetEvidence({
      gatePassed: true,
      finalAssetUrl: ASSET,
      calendarRowId: ROW,
      evidenceRecordId: 'mira-proof-2026-09-17',
      evidenceRecord: record,
      nowMs: NOW,
    });
    assert.ok(violations.some((x) => x.code === code), `expected ${code}`);
  }
});

test('only a fresh canonical exact-final Mira PASS is accepted', () => {
  const violations = validateMiraFinalAssetEvidence({
    gatePassed: true,
    finalAssetUrl: ASSET,
    calendarRowId: ROW,
    evidenceRecordId: 'mira-proof-2026-09-17',
    evidenceRecord: verified(),
    nowMs: NOW,
  });
  assert.deepEqual(violations, []);
});
