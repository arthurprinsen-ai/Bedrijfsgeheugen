import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const html = await readFile('intern/powerhouse-kosten/index.html', 'utf8').catch(() => '');
const client = await readFile('assets/js/powerhouse-kosten.mjs', 'utf8').catch(() => '');
const config = await readFile('netlify.toml', 'utf8');

test('internal dashboard shell contains no operational data and is noindex', () => {
  assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.doesNotMatch(html, /rawPrompt|NOTION_TOKEN|MAKE_API|crmContact|conversationKey/i);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)/i);
});

test('scenario-controlled values use safe DOM text rendering', () => {
  assert.match(client, /\.textContent\s*=/);
  assert.doesNotMatch(client, /\.innerHTML\s*=/);
  assert.match(client, /credentials:\s*'same-origin'/);
});

test('internal dashboard has private no-store and strict route headers', () => {
  const block = config.match(/\[\[headers\]\]\s*\n\s*for\s*=\s*"\/intern\/powerhouse-kosten\/\*"([\s\S]*?)(?=\n\[\[|$)/)?.[1] ?? '';
  assert.match(block, /Cache-Control\s*=\s*"private, no-store"/);
  assert.match(block, /X-Frame-Options\s*=\s*"DENY"/);
  assert.match(block, /X-Robots-Tag\s*=\s*"noindex, nofollow, noarchive"/);
  assert.match(block, /Content-Security-Policy\s*=\s*"default-src 'self';[^\n]*frame-ancestors 'none'/);
});

test('sitemap builder structurally excludes every internal page', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'bg-sitemap-'));
  try {
    await mkdir(join(fixture, 'intern'));
    await writeFile(join(fixture, 'index.html'), '<title>Public</title>');
    await writeFile(join(fixture, 'intern', 'secret.html'), '<title>Private</title>');
    const result = spawnSync(process.execPath, [resolve('tools/bouw-sitemap.mjs')], { cwd: fixture, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const sitemap = await readFile(join(fixture, 'sitemap.xml'), 'utf8');
    assert.match(sitemap, /https:\/\/www\.bedrijfsgeheugen\.nl\/<\/loc>/);
    assert.doesNotMatch(sitemap, /intern|secret/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
