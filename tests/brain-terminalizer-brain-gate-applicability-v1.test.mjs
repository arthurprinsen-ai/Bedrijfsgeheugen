import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal closure skips BRAIN only for docs lane and accepts actual BRAIN event otherwise', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/require_brain_if_applicable/);
  assert.match(workflow,/\[ "\$DELIVERY_LANE" = "docs" \]/);
  assert.match(workflow,/TERMINAL_CRITICAL_GATE_NOT_APPLICABLE:BRAIN:delivery_lane=docs/);
  assert.match(workflow,/unified-brain-delivery\.yml\/runs\?head_sha=\$\{HEAD_SHA\}&per_page=50/);
  assert.doesNotMatch(workflow,/unified-brain-delivery\.yml\/runs\?head_sha=\$\{HEAD_SHA\}&event=pull_request/);
  assert.match(workflow,/TERMINAL_CRITICAL_GATE_PROVEN:BRAIN/);
});
