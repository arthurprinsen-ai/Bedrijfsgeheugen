export const MIRA_EVIDENCE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const clean = (value) => String(value ?? '').trim();

export function validateMiraFinalAssetEvidence({
  gatePassed,
  finalAssetUrl,
  calendarRowId,
  evidenceRecordId,
  evidenceRecord,
  nowMs = Date.now(),
}) {
  const violations = [];
  const add = (code, message) => violations.push({ code, message });
  const finalUrl = clean(finalAssetUrl);
  const rowId = clean(calendarRowId);
  const recordId = clean(evidenceRecordId);

  if (gatePassed !== true) add('MIRA_GATE_NOT_PROVEN', 'Mira hard gate ontbreekt.');
  if (!finalUrl) add('MIRA_FINAL_ASSET_URL_REQUIRED', 'Exacte finale Instagram asset URL ontbreekt.');
  if (!rowId) add('MIRA_CALENDAR_ROW_REQUIRED', 'Instagram kalenderregel ontbreekt.');
  if (!recordId) add('MIRA_EVIDENCE_RECORD_REQUIRED', 'Canoniek Mira evidence record ontbreekt.');
  if (!evidenceRecord) {
    if (recordId) add('MIRA_EVIDENCE_RECORD_NOT_FOUND', 'Canoniek Mira evidence record is niet gevonden.');
    return violations;
  }

  if (clean(evidenceRecord.record_id) !== recordId) {
    add('MIRA_EVIDENCE_RECORD_MISMATCH', 'Mira evidence record-id komt niet overeen met de aangevraagde evidence.');
  }
  if (clean(evidenceRecord.status) !== 'VERIFIED' || evidenceRecord.verified !== true) {
    add('MIRA_EVIDENCE_NOT_VERIFIED', 'Mira evidence is niet VERIFIED.');
  }

  const result = evidenceRecord.result && typeof evidenceRecord.result === 'object' ? evidenceRecord.result : {};
  const payload = evidenceRecord.payload && typeof evidenceRecord.payload === 'object' ? evidenceRecord.payload : {};
  if (clean(result.decision).toUpperCase() !== 'PASS') add('MIRA_EVIDENCE_NOT_PASS', 'Mira evidence heeft geen expliciete PASS.');
  if (clean(result.identity).toLowerCase() !== 'mira') add('MIRA_IDENTITY_NOT_PROVEN', 'Mira-identiteit is niet expliciet bewezen.');
  if (result.exact_final_asset !== true) add('MIRA_EXACT_FINAL_ASSET_NOT_PROVEN', 'Evidence is niet expliciet gebonden aan de exacte finale asset.');
  if (clean(payload.channel) !== 'instagram_company') add('MIRA_EVIDENCE_CHANNEL_MISMATCH', 'Mira evidence hoort niet bij Instagram bedrijfsgeheugen.nl.');
  if (finalUrl && clean(payload.final_asset_url) !== finalUrl) add('MIRA_FINAL_ASSET_MISMATCH', 'Mira evidence hoort bij een andere finale asset.');
  if (rowId && clean(payload.calendar_row_id) !== rowId) add('MIRA_CALENDAR_ROW_MISMATCH', 'Mira evidence hoort bij een andere kalenderregel.');

  const observedAt = Date.parse(clean(evidenceRecord.updated_at));
  if (!Number.isFinite(observedAt) || observedAt > nowMs || nowMs - observedAt > MIRA_EVIDENCE_MAX_AGE_MS) {
    add('MIRA_EVIDENCE_STALE', 'Mira evidence is niet vers genoeg voor deze publicatie.');
  }

  return violations;
}
