import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { findPortalPage } from '../portal-next/portal-content-map.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('portal content map exposes Compliance Command Center under governance', () => {
  const page = findPortalPage('compliance-command-center');
  assert.ok(page);
  assert.equal(page.sectionId, 'vergelijken');
  assert.equal(page.label, 'Compliance Command Center');
});

test('portal navigation exposes Compliance Command Center after Trust & Governance', async () => {
  const nav = await read('portal-next/portal-business-os-navigation.js');
  assert.match(nav, /Trust & Governance[\s\S]*Compliance Command Center/);
  assert.match(nav, /\/portal-next\/compliance\.html/);
});

test('command center page loads canonical CSS, module and customer context bridge', async () => {
  const html = await read('portal-next/compliance.html');
  assert.match(html, /compliance-command-center\.css/);
  assert.match(html, /compliance-command-center\.js/);
  assert.match(html, /bg-compliance-command-center/);
  assert.match(html, /klant/);
});

test('command center links relevant existing trust and audit context', async () => {
  const html = await read('portal-next/compliance.html');
  for (const href of ['/ai-act','/ai-governance','/data-soevereiniteit','/privacy','/due-diligence']) assert.match(html, new RegExp(`href=["']${href}["']`));
});
