import test from 'node:test';
import assert from 'node:assert/strict';
import { assessCompliance, buildAuditSnapshot } from '../compliance-state.js';

test('100% ingevuld is niet automatisch compliant zonder bewijs en review', () => {
  const result = assessCompliance([{ id:'A1', framework:'AI Act', applicable:true, answered:true, measure:true, evidence:false, reviewed:false, approved:false, severity:'high' }]);
  assert.equal(result.completion, 100);
  assert.equal(result.evidence, 0);
  assert.ok(result.readiness < 100);
  assert.equal(result.findings[0].severity, 'high');
});

test('niet van toepassing telt alleen met motivatie en besluitmetadata', () => {
  const invalid = assessCompliance([{ id:'N1', framework:'NIS2', applicable:false, naReason:'', naDecidedBy:'', naDecidedAt:'' }]);
  assert.equal(invalid.readiness, 0);
  assert.equal(invalid.findings[0].code, 'INVALID_NOT_APPLICABLE');
});

test('audit snapshot bevat frameworkversies, risico en acties', () => {
  const assessment = assessCompliance([{ id:'N2', framework:'NIS2', applicable:true, answered:true, measure:false, evidence:false, reviewed:false, approved:false, severity:'critical', nextStep:'Leg incidentrespons vast', why:'Zonder incidentrespons ontbreekt aantoonbare beheersing.' }]);
  const snap = buildAuditSnapshot({ organisation:'Demo BV', generatedAt:'2026-09-08T20:00:00.000Z', frameworkVersions:{'AI Act':'2026-07-27','NIS2':'2022/2555'}, assessment });
  assert.match(snap.snapshotId, /^AUD-20260908-/);
  assert.equal(snap.openRisks[0].severity, 'critical');
  assert.equal(snap.nextActions[0], 'Leg incidentrespons vast');
  assert.equal(snap.frameworkVersions.NIS2, '2022/2555');
});
