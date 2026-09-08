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
  assert.match(nav, /https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/compliance\.html/);
});

test('legacy customer portal injects command center beside existing governance input', async () => {
  const bridge = await read('assets/js/portaal-koppelingen.js');
  assert.match(bridge, /data-p=["']beleid["']/);
  assert.match(bridge, /data-bg-compliance-command-center/);
  assert.match(bridge, /https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/compliance\.html/);
  assert.match(bridge, /klant/);
});

test('command center page loads canonical CSS, module and customer context bridge', async () => {
  const html = await read('portal-next/compliance.html');
  assert.match(html, /https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/compliance-command-center\.css/);
  assert.match(html, /https:\/\/www\.bedrijfsgeheugen\.nl\/portal-next\/compliance-command-center\.js/);
  assert.match(html, /bg-compliance-command-center/);
  assert.match(html, /klant/);
});

test('command center links relevant existing trust and audit context with absolute hrefs', async () => {
  const html = await read('portal-next/compliance.html');
  for (const href of ['https://www.bedrijfsgeheugen.nl/ai-act','https://www.bedrijfsgeheugen.nl/ai-governance','https://www.bedrijfsgeheugen.nl/data-soevereiniteit','https://www.bedrijfsgeheugen.nl/privacy','https://www.bedrijfsgeheugen.nl/due-diligence']) assert.match(html, new RegExp(`href=["']${href}["']`));
});
