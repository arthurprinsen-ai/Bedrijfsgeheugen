import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const workflowPath = '.github/workflows/approved-weekblog.yml';
const rendererPath = 'tools/publish-approved-blog.py';

function read(path) {
  assert.ok(existsSync(path), `${path} must exist`);
  return readFileSync(path, 'utf8');
}

test('approved SEO publisher is deterministic and non-generative', () => {
  const workflow = read(workflowPath);
  const renderer = read(rendererPath);
  const combined = `${workflow}\n${renderer}`.toLowerCase();

  for (const forbidden of [
    'anthropic',
    'claude-code-action',
    'openai',
    'chatgpt',
    'gemini',
    'generatecontent',
    'weekblog.yml/dispatches',
  ]) {
    assert.equal(combined.includes(forbidden), false, `forbidden generative/legacy marker: ${forbidden}`);
  }

  for (const required of [
    'content_id:',
    'slug:',
    'publish_command_id:',
    'source mode',
    'approved central article',
    'approved_source_hash',
    'publish command id',
    'quality gate',
    'autopublish toegestaan',
  ]) {
    assert.equal(combined.includes(required), true, `missing approved-content contract marker: ${required}`);
  }
});

test('renderer never silently picks another queue record', () => {
  const renderer = read(rendererPath);
  assert.match(renderer, /page_size[^\n]{0,80}2/i);
  assert.match(renderer, /len\(rows\)\s*!=\s*1/);
  assert.match(renderer, /expected_command/);
  assert.match(renderer, /publish_command_id/);
  assert.match(renderer, /source_mode/);
});

test('existing slug is verification-only and cannot be overwritten', () => {
  const renderer = read(rendererPath);
  assert.match(renderer, /target\.exists\(\)/);
  assert.match(renderer, /ALREADY_EXISTS_VERIFY_ONLY/);
  assert.equal(/write_text\([^\n]*target/i.test(renderer), false, 'target article must be written only after existence guard');
});
