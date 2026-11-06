import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeBlogMarkdownBlocks} from '../supabase/functions/_shared/blog-markdown-source-contract.mjs';

test('heading followed immediately by body and bullets gets explicit boundaries', () => {
  const raw = 'Intro\n## Wat betekent dit?\nU ziet een risico.\n- Leg signaal vast\n- Benoem eigenaar\nVolgende stap.\n### Controle\n- Meet het effect';
  const expected = 'Intro\n\n## Wat betekent dit?\n\nU ziet een risico.\n\n- Leg signaal vast\n- Benoem eigenaar\n\nVolgende stap.\n\n### Controle\n\n- Meet het effect';
  assert.equal(normalizeBlogMarkdownBlocks(raw), expected);
  assert.equal(normalizeBlogMarkdownBlocks(expected), expected);
});

test('does not change approved factual wording or invent a FAQ', () => {
  const raw = '## Hoe controleer je dit?\nEen antwoord met 2 getallen.\n- Stap één: € 25\n  - Detail blijft ingesprongen\n\n## Geen vraagkop\nKlaar.';
  const output = normalizeBlogMarkdownBlocks(raw);
  assert.match(output, /## Hoe controleer je dit\?/);
  assert.match(output, /€ 25/);
  assert.match(output, /\n  - Detail blijft ingesprongen/);
  assert.match(output, /## Geen vraagkop\n\nKlaar\./);
  assert.equal(normalizeBlogMarkdownBlocks(output), output);
});

test('handles numbered lists, CRLF, and existing blank lines without duplication', () => {
  const raw='Intro\r\n\r\n## Stappen\r\n1. Eerst\r\n2. Daarna\r\nSlot';
  const result=normalizeBlogMarkdownBlocks(raw);
  assert.equal(result, 'Intro\n\n## Stappen\n\n1. Eerst\n2. Daarna\n\nSlot');
  assert.equal(normalizeBlogMarkdownBlocks(result), result);
});

test('original canonical generator and exporter both enforce one contract', () => {
  const orchestrator=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  const exporter=readFileSync('supabase/functions/powerhouse-blog-export/index.ts','utf8');
  assert.match(orchestrator,/import \{ normalizeBlogMarkdownBlocks \} from '\.\.\/_shared\/blog-markdown-source-contract\.mjs'/);
  assert.match(exporter,/import \{ normalizeBlogMarkdownBlocks \} from '\.\.\/_shared\/blog-markdown-source-contract\.mjs'/);
  assert.match(orchestrator,/bodyText=normalizeBlogMarkdownBlocks\(bodyText\)/);
  assert.match(orchestrator,/const revisedBody=normalizeBlogMarkdownBlocks\(clean\(revised\?\.body\)\)/);
  assert.match(exporter,/body:normalizeBlogMarkdownBlocks\(clean\(a\.body\)\)/);
  assert.match(orchestrator,/lege regel vóór iedere kop/i);
});
