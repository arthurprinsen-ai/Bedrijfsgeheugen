import test from 'node:test';
import assert from 'node:assert/strict';
import { certifyWriterParityRollback } from '../scripts/brain/writer-parity-rollback-certification.mjs';

test('certifies parity only when direct and candidate outputs are byte-identical', () => {
  const result=certifyWriterParityRollback({
    writer:'weekblog', baseSha:'a'.repeat(40), candidateHeadSha:'b'.repeat(40), rollbackSha:'a'.repeat(40),
    directOutputSha256:'1'.repeat(64), candidateOutputSha256:'1'.repeat(64), rollbackOutputSha256:'2'.repeat(64), baseOutputSha256:'2'.repeat(64),
    operationalCandidateVerified:true, pathPolicyVerified:true, exactHeadVerified:true,
    evidenceRef:'github-run:1', outcomeRouter:'BG168', currentStateProjection:'BG167'
  });
  assert.equal(result.parityVerified,true);
  assert.equal(result.rollbackVerified,true);
  assert.equal(result.truth_status,'VERIFIED');
  assert.equal(result.status,'COMPLETED');
  assert.equal(result.proof,'writer-parity-rollback');
  assert.equal(Object.isFrozen(result),true);
});

test('fails closed on output mismatch or rollback that does not restore exact base output', () => {
  assert.throws(()=>certifyWriterParityRollback({
    writer:'weekblog', baseSha:'a'.repeat(40), candidateHeadSha:'b'.repeat(40), rollbackSha:'a'.repeat(40),
    directOutputSha256:'1'.repeat(64), candidateOutputSha256:'3'.repeat(64), rollbackOutputSha256:'2'.repeat(64), baseOutputSha256:'2'.repeat(64),
    operationalCandidateVerified:true, pathPolicyVerified:true, exactHeadVerified:true,
    evidenceRef:'github-run:1', outcomeRouter:'BG168', currentStateProjection:'BG167'
  }),/PARITY_MISMATCH/);
  assert.throws(()=>certifyWriterParityRollback({
    writer:'weekblog', baseSha:'a'.repeat(40), candidateHeadSha:'b'.repeat(40), rollbackSha:'a'.repeat(40),
    directOutputSha256:'1'.repeat(64), candidateOutputSha256:'1'.repeat(64), rollbackOutputSha256:'4'.repeat(64), baseOutputSha256:'2'.repeat(64),
    operationalCandidateVerified:true, pathPolicyVerified:true, exactHeadVerified:true,
    evidenceRef:'github-run:1', outcomeRouter:'BG168', currentStateProjection:'BG167'
  }),/ROLLBACK_OUTPUT_MISMATCH/);
});

test('fails closed without operational and BRAIN lineage prerequisites', () => {
  assert.throws(()=>certifyWriterParityRollback({}),/INVALID_WRITER/);
  assert.throws(()=>certifyWriterParityRollback({writer:'weekblog',baseSha:'a'.repeat(40),candidateHeadSha:'b'.repeat(40),rollbackSha:'a'.repeat(40),directOutputSha256:'1'.repeat(64),candidateOutputSha256:'1'.repeat(64),rollbackOutputSha256:'2'.repeat(64),baseOutputSha256:'2'.repeat(64),operationalCandidateVerified:false,pathPolicyVerified:true,exactHeadVerified:true,evidenceRef:'x',outcomeRouter:'BG168',currentStateProjection:'BG167'}),/OPERATIONAL_CANDIDATE_NOT_VERIFIED/);
});
