import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workflowPath='.github/workflows/unified-brain-delivery.yml';

test('Brain production handoff is GitHub-native only and cannot route through Make',async()=>{
  const workflow=await readFile(workflowPath,'utf8');
  assert.doesNotMatch(workflow,/BG169_HANDOFF_URL/);
  assert.doesNotMatch(workflow,/primary Make transport/i);
  assert.doesNotMatch(workflow,/transport="make"/);
  assert.doesNotMatch(workflow,/make_accepted/);
  assert.match(workflow,/BG169 GitHub-native production transport/);
  assert.match(workflow,/transport="github-native"/);
  assert.match(workflow,/BG169_GITHUB_NATIVE_MERGE_REJECTED/);
});
