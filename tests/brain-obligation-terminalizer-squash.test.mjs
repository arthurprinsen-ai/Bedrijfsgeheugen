import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('terminalizer accepts exact squash-tree equivalence without weakening fail-closed lineage', () => {
  const yaml=readFileSync('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(yaml,/git fetch origin "\$CANDIDATE_SHA" --no-tags \|\| true/);
  assert.match(yaml,/git merge-base --is-ancestor "\$CANDIDATE_SHA" "\$MERGE_SHA"/);
  assert.match(yaml,/git rev-parse "\$CANDIDATE_SHA\^\{tree\}"/);
  assert.match(yaml,/git rev-parse "\$MERGE_SHA\^\{tree\}"/);
  assert.match(yaml,/lineage_mode="squash_tree_equivalent"/);
  assert.match(yaml,/POST_MERGE_CANDIDATE_NOT_CONTAINED_OR_TREE_EQUIVALENT/);
  assert.match(yaml,/git merge-base --is-ancestor "\$MERGE_SHA" origin\/main/);
  assert.match(yaml,/merged_lineage_verified:\['ancestor','squash_tree_equivalent'\]\.includes\(lineage\.lineage_mode\)/);
});
