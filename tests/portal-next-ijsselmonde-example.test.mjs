import test from 'node:test';
import assert from 'node:assert/strict';
import {initialPortalPage,portalPageUrl} from '../portal-next/portal-navigation-complete.js';

test('IJsselmonde example deep-links the new portal to the offerte page',()=>{
  assert.equal(initialPortalPage('?klant=ijsselmonde&page=offerte'),'offerte');
});

test('unknown or missing page falls back to overzicht',()=>{
  assert.equal(initialPortalPage('?klant=ijsselmonde'),'overzicht');
  assert.equal(initialPortalPage('?klant=ijsselmonde&page=bestaat-niet'),'overzicht');
});

test('native navigation preserves customer context without legacy route',()=>{
  assert.equal(portalPageUrl('documenten','?klant=ijsselmonde&page=offerte'),'/portal-next/?klant=ijsselmonde&page=documenten');
  assert.doesNotMatch(portalPageUrl('offerte','?klant=ijsselmonde'),/klantportaal/);
});
