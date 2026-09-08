import test from 'node:test';
import assert from 'node:assert/strict';
import { HUB_DEFINITIONS, hubPages } from '../portal-v2/hubs.js';
import { findPage } from '../portal-v2/page-registry.js';

test('four primary mobile hubs expose explicit native page sets', () => {
  assert.deepEqual(Object.keys(HUB_DEFINITIONS), ['portal','data-ai','tasks','more']);
  for (const hubId of Object.keys(HUB_DEFINITIONS)) {
    const pages=hubPages(hubId);
    assert.ok(pages.length>0, `${hubId} must expose real pages`);
    for(const pageId of pages) assert.ok(findPage(pageId), `${hubId} -> ${pageId}`);
  }
});

test('Data & AI hub exposes source, connector, AI and Brain capabilities', () => {
  const pages=hubPages('data-ai');
  for(const id of ['data-ai','koppelingen','ai-scan','ai-capabilities','datahubstatus','brain-verwerking','agentstatus']) assert.ok(pages.includes(id), id);
});

test('Taken hub exposes execution, roadmap, recovery and outcomes', () => {
  const pages=hubPages('tasks');
  for(const id of ['taken-werkstromen','actieve-acties','roadmap','recovery-obligations','outcomes-evidence']) assert.ok(pages.includes(id), id);
});
