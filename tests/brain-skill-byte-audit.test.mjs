import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectSkillByteAudit } from '../scripts/brain/skill-byte-audit.mjs';

test('reads real skill bytes and refuses to present loading as application', async () => {
  const root=await mkdtemp(join(tmpdir(),'skill-audit-'));
  try {
    await mkdir(join(root,'.agents/skills/demo'),{recursive:true});
    await mkdir(join(root,'brain/skills'),{recursive:true});
    await writeFile(join(root,'.agents/skills/demo/SKILL.md'),'actual skill bytes');
    const proof=await collectSkillByteAudit({root,runId:'123',runAttempt:'1',headSha:'a'.repeat(40)});
    assert.equal(proof.skills.length,1);
    assert.equal(proof.skills[0].path,'.agents/skills/demo/SKILL.md');
    assert.match(proof.skills[0].contentSha256,/^[a-f0-9]{64}$/);
    assert.equal(proof.status,'LOADED_BYTES_ONLY');
    assert.equal(proof.applicationVerified,false);
    assert.equal(proof.independentVerifier,false);
  } finally {await rm(root,{recursive:true,force:true});}
});
test('missing trusted run context is fail closed', async () => {
  await assert.rejects(collectSkillByteAudit({runId:'fake',runAttempt:'1',headSha:'a'.repeat(40)}),/TRUSTED_RUN_CONTEXT_REQUIRED/);
});
test('no skills observed fails closed', async () => {
  const root=await mkdtemp(join(tmpdir(),'skill-audit-'));
  try {
    await mkdir(join(root,'.agents/skills'),{recursive:true});
    await mkdir(join(root,'brain/skills'),{recursive:true});
    await assert.rejects(collectSkillByteAudit({root,runId:'123',runAttempt:'1',headSha:'a'.repeat(40)}),/NO_SKILLS_OBSERVED/);
  } finally {await rm(root,{recursive:true,force:true});}
});
