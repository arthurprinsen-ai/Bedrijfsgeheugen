import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync('assets/js/i18n.js','utf8');

// Execute the original browser translate() as an isolated, real async function.
// No network, browser storage or external billing credentials are used.
function makeRuntime(fetchImpl) {
  const begin = source.indexOf('  async function translate(strings, target, requestEpoch) {');
  const end = source.indexOf('\n  function applyLocalTranslations',begin);
  assert.ok(begin > 0 && end > begin);
  assert.match(source,/const PROVIDER_RETRY_COOLDOWN_MS = 5 \* 60 \* 1000;/);
  assert.match(source,/let providerRetryAfter = 0;/);
  const js = [
    "'use strict';",
    'const PROVIDER_RETRY_COOLDOWN_MS = 5 * 60 * 1000;',
    'let providerRetryAfter = 0;',
    'let localeEpoch = 0;',
    'let cache = {};',
    "const cacheId = (target,source) => target + '|' + source;",
    'const localTranslation = () => null;',
    'const saveCache = () => {};',
    "const context = () => 'public';",
    source.slice(begin,end),
    'globalThis.callTranslate = translate;'
  ].join('\n');
  const sandbox = { fetch:fetchImpl, Date, JSON, Map, Set };
  runInNewContext(js,sandbox,{timeout:1000});
  return sandbox.callTranslate;
}

test('one upstream 502 prevents batch splitting and all per-item retry fan-out for many strings',async()=>{
  let requests=0;
  const translate=makeRuntime(async()=>{requests+=1;return {ok:false,status:502}});
  const strings=Array.from({length:43},(_,i)=>'Originele contentregel '+i);
  await assert.rejects(translate(strings,'en',0),/translation_provider_unavailable/);
  assert.equal(requests,1,'first 502 MUST stop the whole paid provider fan-out');
  await assert.rejects(translate(strings,'en',0),/translation_temporarily_unavailable/);
  assert.equal(requests,1,'warm browser cooldown MUST block repeated provider 502s');
});

test('network outage, 429 and 503 immediately stop further provider calls',async()=>{
  for(const status of [429,503]) {
    let requests=0;
    const translate=makeRuntime(async()=>{requests+=1;return {ok:false,status}});
    await assert.rejects(translate(['Bron A','Bron B'],'en',0),/translation_provider_unavailable/);
    await assert.rejects(translate(['Andere bron C'],'en',0),/translation_temporarily_unavailable/);
    assert.equal(requests,1);
  }
  let network=0;
  const translate=makeRuntime(async()=>{network++;throw new Error('network down')});
  await assert.rejects(translate(['Echt probleem'],'en',0),/translation_provider_unavailable/);
  assert.equal(network,1);
});

test('approved 200 shape still returns real translated text and caches it',async()=>{
  let count=0;
  const translate=makeRuntime(async(_url,req)=>{
    count+=1;
    assert.equal(req.method,'POST');
    const json=JSON.parse(req.body);
    assert.deepEqual(json.strings,['Een Nederlandse test','Tweede Nederlandse tekst']);
    return {ok:true,json:async()=>({translations:['An English test','Second English text']})};
  });
  const result=await translate(['Een Nederlandse test','Tweede Nederlandse tekst'],'en',0);
  assert.equal(count,1);
  assert.equal(result.get('Een Nederlandse test'),'An English test');
  assert.equal(result.get('Tweede Nederlandse tekst'),'Second English text');
});

test('incomplete successful provider response stays a visible quality failure, not a costly replay',async()=>{
  let count=0;
  const translate=makeRuntime(async()=>{count++;return {ok:true,json:async()=>({translations:['']})}});
  await assert.rejects(translate(['Ontbrekende vertaling'],'en',0),/translation_incomplete:1/);
  assert.equal(count,1);
});

test('static /en route retains links but never re-sends DOM mutations for translation',()=>{
  assert.match(source,/roots\.forEach\(root => syncInternalLinks\(root\)\);/);
  assert.match(source,/if \(!isPortal\(\) && pathLocale\(\) === 'en' &&\s*document\.documentElement\.dataset\.bgStaticTranslated !== 'false'\) return;/);
  assert.doesNotMatch(source,/requestPart\(part\.slice\(i,i\+5\)\)/);
  assert.doesNotMatch(source,/await requestPart\(\[source\]\)/);
  assert.doesNotMatch(source,/for \(let attempt=0; attempt<2; attempt\+\+\)/);
  assert.match(source,/throw new Error\('translation_temporarily_unavailable'\)/);
});
