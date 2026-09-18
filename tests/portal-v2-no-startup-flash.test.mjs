import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../portal-v2/index.html',import.meta.url),'utf8');
const stateClient=readFileSync(new URL('../portal-v2/portal-state.js',import.meta.url),'utf8');

test('Portal V2 blocks the generic shell at parser time before the first browser paint',()=>{
  const head=html.slice(0,html.indexOf('</head>'));
  assert.match(html,/^<!doctype html>\s*<html[^>]*class=["'][^"']*v2-hydrating/);
  assert.match(head,/<style id=["']portalBoot["']>/);
  assert.match(head,/v2-hydrating body>\*\{visibility:hidden!important\}/);
  assert.match(head,/body::before\{content:["']Portaal laden…["']/);
  assert.ok(head.indexOf('id="portalBoot"') < head.indexOf('rel="stylesheet"'),'critical hydration guard must precede external stylesheets');
});

test('the hydration guard stays active until portal state settles, with a bounded fail-safe',()=>{
  assert.match(stateClient,/releaseBootGuard/);
  assert.match(stateClient,/publish=next=>/);
  assert.match(stateClient,/releaseBootGuard\(\)/);
  assert.match(stateClient,/setTimeout\(releaseBootGuard,5000\)/);
});
