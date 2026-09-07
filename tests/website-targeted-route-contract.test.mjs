import test from 'node:test';
import assert from 'node:assert/strict';
import { routeIdentity, summarizeRouteResult } from '../tools/verify-targeted-website-routes.mjs';

test('route identity accepts the matching canonical path', () => {
  assert.equal(routeIdentity({ route:'/ai-act', canonical:'https://www.bedrijfsgeheugen.nl/ai-act', title:'AI Act | Bedrijfsgeheugen' }).ok, true);
});

test('blank page is a hard failure', () => {
  assert.equal(summarizeRouteResult({ visibleText:'   ', html:'<html><body></body></html>', pageErrors:[], failedAssets:[] }).ok, false);
});

test('uncaught browser error is a hard failure', () => {
  assert.equal(summarizeRouteResult({ visibleText:'content', html:'<main>content</main>', pageErrors:['ReferenceError'], failedAssets:[] }).ok, false);
});

test('failed critical same-origin assets are a hard failure', () => {
  assert.equal(summarizeRouteResult({ visibleText:'content', html:'<main>content</main>', pageErrors:[], failedAssets:['script:/assets/app.js'] }).ok, false);
});
