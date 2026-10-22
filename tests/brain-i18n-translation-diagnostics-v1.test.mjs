import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyI18nError, reportI18nError } from '../netlify/functions/_i18n-error-evidence.mjs';

const requestId = '123e4567-e89b-12d3-a456-426614174000';

test('provider HTTP code is classified without raw provider message or secret', () => {
  const logs = [];
  const event = reportI18nError({
    error: new Error('429 provider_secret_sk-example contact user@tenant.nl'),
    requestId,
    dataClass: 'Confidential',
    log: line => logs.push(line),
  });
  assert.equal(event.failure_class, 'UPSTREAM_HTTP_REJECTION');
  assert.equal(event.upstream_status, 429);
  assert.equal(event.request_id, requestId);
  assert.equal(event.data_class, 'Confidential');
  assert.equal(logs.length, 1);
  assert.deepEqual(JSON.parse(logs[0]), event);
  assert.doesNotMatch(logs[0], /provider_secret|sk-example|tenant\.nl/);
});

test('non-provider errors do not disclose arbitrary contents', () => {
  const logs = [];
  const event = reportI18nError({
    error: new Error('Translation response was not valid JSON for a private customer'),
    requestId: 'untrusted-id-with-customer-data',
    dataClass: 'Confidential',
    log: line => logs.push(line),
  });
  assert.equal(event.failure_class, 'TRANSLATION_RUNTIME_OR_SHAPE');
  assert.equal(event.upstream_status, null);
  assert.equal(event.request_id, null);
  assert.doesNotMatch(logs[0], /private customer|untrusted-id/);
});

test('diagnostic transport failure never changes the original API error path', () => {
  assert.doesNotThrow(() => reportI18nError({
    error:new Error('500 third-party'), requestId, dataClass:'Public',
    log:()=>{throw new Error('log collector unavailable');}
  }));
});

test('sovereignty is classified separately and never bypassed', () => {
  assert.deepEqual(classifyI18nError({code:'DATA_SOVEREIGNTY_AI_BLOCKED'}), {
    failure_class:'SOVEREIGNTY_DENIED',upstream_status:null
  });
});

test('timeouts are distinct from provider rejection and never guessed', () => {
  assert.deepEqual(classifyI18nError({name:'TimeoutError',message:'private content'}), {
    failure_class:'UPSTREAM_TIMEOUT',upstream_status:null
  });
  assert.equal(classifyI18nError(new Error('unexpected 429: unknown')).upstream_status, null);
});

test('existing API contract remains fail-closed and source calls diagnostic logger', () => {
  const route = readFileSync(new URL('../netlify/functions/i18n-translate.mjs', import.meta.url),'utf8');
  assert.match(route,/reportI18nError\(\{\s*error,\s*requestId,\s*dataClass\s*\}\)/);
  assert.match(route,/error:'translation_failed'\},\{status:502\}/);
  assert.match(route,/error:error\.code\},\{status:409\}/);
  assert.ok(route.indexOf('DATA_SOVEREIGNTY_AI_BLOCKED') < route.indexOf('reportI18nError({error,requestId,dataClass})'));
});
