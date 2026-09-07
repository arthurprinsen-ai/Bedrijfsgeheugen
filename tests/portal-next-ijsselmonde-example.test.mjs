import test from 'node:test';
import assert from 'node:assert/strict';
import { initialPortalPage, legacyFrameUrl } from '../portal-next/portal-navigation-complete.js';

test('IJsselmonde example deep-links the new portal to the offerte page', () => {
  assert.equal(initialPortalPage('?klant=ijsselmonde&page=offerte'), 'offerte');
});

test('unknown or missing page falls back to overzicht', () => {
  assert.equal(initialPortalPage('?klant=ijsselmonde'), 'overzicht');
  assert.equal(initialPortalPage('?klant=ijsselmonde&page=bestaat-niet'), 'overzicht');
});

test('legacy parity frame preserves IJsselmonde customer context', () => {
  assert.equal(legacyFrameUrl('?klant=ijsselmonde&page=offerte'), '/klantportaal.html?klant=ijsselmonde');
});
