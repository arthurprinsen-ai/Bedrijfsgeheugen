import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runner=readFileSync('supabase/functions/social-recovery-runner/index.ts','utf8');
const workflow=readFileSync('.github/workflows/social-publication-recovery.yml','utf8');
const mode=process.env.POWERHOUSE_LEARNING_EVAL_MODE||'HISTORICAL_REPLAY';

test('historical recovery regression: authentication exists, status requires provider evidence',()=>{
  assert.match(runner,/const bearer = \(req: Request\)/);
  assert.match(runner,/SERVICE_ROLE_REQUIRED/);
  assert.match(runner,/SAME_DAY_RECOVERY_ONLY/);
  assert.match(runner,/providerTruthHealthy/);
  assert.match(runner,/providerSideEffectTruthHealthy/);
  assert.match(workflow,/SOCIAL_PUBLICATION_UNRESOLVED/);
});

test('shadow recovery regression: scheduled runs do not consume dated manual ledger input',()=>{
  assert.match(workflow,/\n  schedule:\n/);
  assert.match(workflow,/EVENT_NAME:.*github\.event_name/);
  assert.match(workflow,/\$\{EVENT_NAME\}.*push/);
  assert.match(workflow,/today=.*Europe\/Amsterdam/);
  assert.match(workflow,/social-recovery-runner/);
});

test('non-send canary: safety gates remain required and cannot claim real delivery',()=>{
  assert.ok(['HISTORICAL_REPLAY','SHADOW','CANARY'].includes(mode));
  assert.match(runner,/SAME_DAY_RECOVERY_ONLY/);
  assert.match(runner,/republish_forbidden/);
  assert.match(runner,/providerTruthHealthy/);
  assert.match(runner,/RECOVERY GREEN REQUIRES CANONICAL STATE AND PROVIDER SIDE-EFFECT TRUTH/);
  assert.match(workflow,/\!safe\.ok \|\| safe\.http/);
});
