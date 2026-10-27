import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hygiene=readFileSync(new URL('../.github/workflows/powerhouse-delivery-hygiene.yml',import.meta.url),'utf8');
const required=readFileSync(new URL('../.github/workflows/required-test.yml',import.meta.url),'utf8');
const meta=readFileSync(new URL('../tools/delivery/delivery-metadata-authority.mjs',import.meta.url),'utf8');

test('merge-group hygiene rejects wrong checkout SHA before admission',()=>{
  assert.match(hygiene,/MERGE_GROUP_HEAD_SHA: \$\{\{ github\.event\.merge_group\.head_sha \}\}/);
  assert.match(hygiene,/\[ "\$GITHUB_SHA" != "\$MERGE_GROUP_HEAD_SHA" \]/);
  assert.match(hygiene,/\[ "\$\(git rev-parse HEAD\)" != "\$MERGE_GROUP_HEAD_SHA" \]/);
  assert.match(hygiene,/MERGE_GROUP_SHA_MISMATCH/);
  assert.match(hygiene,/admitted=false/);
  assert.match(hygiene,/exit 78/);
});

test('merge-group still denied when provider-bound aggregate lineage is missing',()=>{
  assert.match(meta,/MERGE_GROUP_ADMISSION_PROOF_REQUIRED/);
  assert.match(required,/eventName:\s*process\.env\.EVENT_NAME/);
  assert.match(required,/^  merge_group:/m);
  assert.match(required,/^  test:/m);
  assert.match(hygiene,/MERGE_GROUP_PREVALIDATED/);
});

test('guard does not add another PR entrypoint, writer or schedule',()=>{
  assert.doesNotMatch(hygiene,/^  pull_request:/m);
  assert.doesNotMatch(hygiene,/^  schedule:/m);
  assert.match(hygiene,/^  workflow_call:/m);
});
