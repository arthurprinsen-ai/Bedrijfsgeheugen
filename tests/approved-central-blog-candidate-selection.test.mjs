import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('scheduled approved-blog workflow parses the writer JSON array instead of treating it as JSONL', async () => {
  const workflow = await readFile('.github/workflows/approved-central-blog.yml', 'utf8');

  assert.match(workflow, /candidates\s*=\s*json\.loads\(path\.read_text\(encoding='utf-8'\)\)/);
  assert.match(workflow, /for\s+item\s+in\s+candidates:/);
  assert.doesNotMatch(workflow, /raw\.startswith\('\{'\)/);
});
