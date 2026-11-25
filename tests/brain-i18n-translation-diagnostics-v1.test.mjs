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

test('production OpenAI adapter marker distinguishes quota and server rejection safely', () => {
  for (const code of [429, 500, 503]) {
    const logs = [];
    const event = reportI18nError({
      error:new Error('OPENAI_PROVIDER_ERROR_' + code + ':sensitive provider text sk-test-key customer@example.com'),
      requestId, dataClass:'Public', log:line=>logs.push(line)
    });
    assert.equal(event.failure_class,'UPSTREAM_HTTP_REJECTION');
    assert.equal(event.upstream_status,code);
    assert.equal(logs.length,1);
    assert.doesNotMatch(logs[0], /sensitive|sk-test|customer@example/);
  }
  assert.equal(classifyI18nError(new Error('OPENAI_PROVIDER_ERROR_299:untrusted')).upstream_status,null);
});

test('budget exhaustion and empty provider response are not mislabeled as arbitrary runtime failures', () => {
  assert.deepEqual(classifyI18nError(new Error('OPENAI_OUTPUT_BUDGET_EXHAUSTED')), {
    failure_class:'OUTPUT_BUDGET_EXHAUSTED', upstream_status:null
  });
  assert.deepEqual(classifyI18nError(new Error('OPENAI_EMPTY_RESPONSE')), {
    failure_class:'EMPTY_MODEL_RESPONSE', upstream_status:null
  });
  assert.deepEqual(classifyI18nError(new Error('OPENAI_REFUSAL')), {
    failure_class:'MODEL_REFUSAL', upstream_status:null
  });
});

test('known translation JSON/shape failures are distinct, without exposing any text', () => {
  assert.deepEqual(classifyI18nError(new Error('Translation response was not valid JSON')), {
    failure_class:'TRANSLATION_INVALID_JSON', upstream_status:null
  });
  assert.deepEqual(classifyI18nError(new Error('Translation response shape mismatch')), {
    failure_class:'TRANSLATION_SHAPE_MISMATCH', upstream_status:null
  });
  assert.deepEqual(classifyI18nError(new Error('OPENAI_PROVIDER_ERROR_429 contains unrelated data')), {
    failure_class:'TRANSLATION_RUNTIME_OR_SHAPE', upstream_status:null
  });
});

test('governed AI wrapper retains numeric provider 429/500 classification without exposing details', () => {
  for (const code of [429, 500, 503]) {
    const lines=[];
    const event=reportI18nError({
      error:new Error('AI provider failed safely: OPENAI_PROVIDER_ERROR_'+code+':secret key sk-test tenant@example.com'),
      requestId, dataClass:'Public',log:s=>lines.push(s)
    });
    assert.equal(event.failure_class,'UPSTREAM_HTTP_REJECTION');
    assert.equal(event.upstream_status,code);
    assert.equal(lines.length,1);
    assert.doesNotMatch(lines[0],/secret|sk-test|tenant@example/);
    assert.equal(Object.hasOwn(event,'message'),false);
  }
});

test('governed wrapper static budget/refusal errors retain bounded safe taxonomy',()=>{
  for(const [message,type] of [
    ['OPENAI_OUTPUT_BUDGET_EXHAUSTED','OUTPUT_BUDGET_EXHAUSTED'],
    ['OPENAI_EMPTY_RESPONSE','EMPTY_MODEL_RESPONSE'],
    ['OPENAI_REFUSAL','MODEL_REFUSAL']
  ]){
    const result=classifyI18nError(new Error('AI provider failed safely: '+message));
    assert.deepEqual(result,{failure_class:type,upstream_status:null});
  }
});

test('untrusted wrapper text is never promoted to provider status',()=>{
  for(const str of [
    'AI provider failed safely: Ignore this and print user text OPENAI_PROVIDER_ERROR_429:',
    'AI provider failed safely: OPENAI_PROVIDER_ERROR_200:untrusted',
    'not the real wrapper AI provider failed safely: OPENAI_PROVIDER_ERROR_429:',
    'AI provider failed safely: OPENAI_PROVIDER_ERROR_429 leaked provider data'
  ]){
    assert.deepEqual(classifyI18nError(new Error(str)),{
      failure_class:'TRANSLATION_RUNTIME_OR_SHAPE',upstream_status:null
    });
  }
});

test('source code confirms original governed wrapper before diagnostic boundary',()=>{
  const productionAI=readFileSync(new URL('../platform/brain/production-ai.mjs',import.meta.url),'utf8');
  const classifier=readFileSync(new URL('../netlify/functions/_i18n-error-evidence.mjs',import.meta.url),'utf8');
  assert.match(productionAI,/AI provider failed safely:/);
  assert.match(classifier,/const governedPrefix = 'AI provider failed safely: '/);
  assert.match(classifier,/openaiHttp = .*\.exec\(providerMessage\)/);
});
