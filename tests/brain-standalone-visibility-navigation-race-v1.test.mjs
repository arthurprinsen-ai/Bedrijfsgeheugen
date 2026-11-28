import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regression contract for the two real failures in canonical production
// visibility run #37892820886. This does not mock or authorize any customer.
const source = await readFile('tools/site-shell/standalone-visibility-check.mjs', 'utf8');

test('navigation race retries once only after a new verified route load', () => {
  assert.match(source, /async function readVisibleState\(page, url, navigationResponse\)/);
  assert.match(source, /for \(let attempt = 1; attempt <= 2; attempt\+\+\)/);
  assert.match(source, /Execution context was destroyed\|Cannot find context with specified id/);
  assert.match(source, /if \(!navigationRace \|\| attempt === 2\) throw error/);
  assert.match(source, /navigationResponse = await openReachable\(page, url\)/);
  assert.match(source, /const state = await readVisibleState\(page, url, navigationResponse\)/);
});

test('no-response recovery requires same origin, same route, and independent HTTP 2xx', () => {
  assert.match(source, /actual\.origin === expected\.origin/);
  assert.match(source, /normalizePath\(actual\) === normalizePath\(expected\)/);
  assert.match(source, /await page\.request\.get\(url, \{ timeout: navigationTimeoutMs, failOnStatusCode: false \}\)/);
  assert.match(source, /if \(probeResponse\.ok\(\)\)/);
  assert.match(source, /if \(!transientStatuses\.has\(probeResponse\.status\(\)\)\) break/);
  assert.match(source, /HTTP no-response and route mismatch/);
});

test('all sitemap routes and viewports still receive fail-closed browser checks', () => {
  assert.match(source, /for \(let routeIndex = workerIndex; routeIndex < routes\.length; routeIndex \+= workerCount\)/);
  assert.match(source, /for \(let viewportIndex = 0; viewportIndex < viewports\.length; viewportIndex \+= viewportConcurrency\)/);
  assert.match(source, /if \(state\.textLength < 120\) failures\.push/);
  assert.match(source, /if \(state\.cls > 0\.1\) failures\.push/);
  assert.match(source, /throw new Error\(message\)/);
});

test('navigation retry reads robots header from replacement verified response', async () => {
  const fn=source.slice(source.indexOf('async function readVisibleState('),source.indexOf('async function loadPublicRoutes('));
  let opens=0, evals=0;
  const retryResponse={headers:()=>({'x-robots-tag':'noindex'})};
  const originalResponse={headers:()=>({'x-robots-tag':'index'})};
  const page={evaluate:async()=>{if(++evals===1)throw Error('Execution context was destroyed');return {seo:{}};}};
  const read=Function('waitForFontsBounded','sleep','openReachable',fn+';return readVisibleState;')(
    async()=>{},async()=>{},async()=>{opens++;return retryResponse;});
  const result=await read(page,'https://www.bedrijfsgeheugen.nl/en/inloggen',originalResponse);
  assert.equal(opens,1);
  assert.equal(evals,2);
  assert.equal(result.seo.xRobotsHeader,'noindex');
  await assert.rejects(read({evaluate:async()=>{throw Error('unrelated failure');}},'https://www.bedrijfsgeheugen.nl/',originalResponse),/unrelated failure/);
  assert.equal(opens,1);
});
