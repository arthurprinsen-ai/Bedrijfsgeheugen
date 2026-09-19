import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('terminalizer passes same-step lineage mode directly and fails closed on any false terminal evidence check', () => {
  const yaml=readFileSync('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(yaml,/PR_BODY="\$PR_BODY" CANDIDATE_SHA="\$CANDIDATE_SHA" MERGE_SHA="\$MERGE_SHA" PR_NUMBER="\$PR_NUMBER" LINEAGE_MODE="\$lineage_mode" node/);
  assert.match(yaml,/const failedChecks=Object\.entries\(checks\)\.filter/);
  assert.match(yaml,/TERMINAL_EVIDENCE_NOT_PROVEN/);
  assert.match(yaml,/if\(failedChecks\.length\)/);
  const statusIndex=yaml.indexOf("terminal_status:'LIVE_BEWEZEN'");
  const failureIndex=yaml.indexOf("TERMINAL_EVIDENCE_NOT_PROVEN");
  assert.ok(failureIndex >= 0 && statusIndex > failureIndex, 'LIVE_BEWEZEN must only be assigned after fail-closed check validation');
  assert.match(yaml,/lineage_mode:lineage\.lineage_mode/);
});
