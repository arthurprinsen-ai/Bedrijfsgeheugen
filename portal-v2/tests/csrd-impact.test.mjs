import test from 'node:test';
import assert from 'node:assert/strict';
import { findPortalPage, PORTAL_SECTIONS } from '../../portal-next/portal-content-map.js';

test('CSRD impact is a first-class portal page in Inzicht', () => {
  const page = findPortalPage('csrd-impact');
  assert.ok(page, 'csrd-impact must be registered');
  assert.equal(page.sectionId, 'inzicht');
  assert.equal(page.label, 'CSRD & Impact');
  assert.equal(page.legacyTab, null);
  assert.ok(PORTAL_SECTIONS.inzicht.pages.includes('csrd-impact'));
});
