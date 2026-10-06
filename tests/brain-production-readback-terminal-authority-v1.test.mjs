import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateSafeProductionSupersession, NON_PRODUCTION_EXACT, NETLIFY_RUNTIME_PREFIXES, NETLIFY_RUNTIME_EXACT, isNetlifyRuntimePath } from '../tools/site-shell/production-supersession.mjs';

const contract=JSON.parse(fs.readFileSync('brain/contracts/production-readback-v1.json','utf8'));

test('production supersession uses the canonical verifier-only path authority', () => {
  for (const path of contract.productionTruth.verifierOnlyPaths) {
    assert.ok(NON_PRODUCTION_EXACT.has(path), `supersession does not recognize verifier-only path: ${path}`);
  }

  const result=evaluateSafeProductionSupersession({
    expectedCommit:'a'.repeat(40),
    observedCommit:'b'.repeat(40),
    expectedIsAncestor:true,
    changedPaths:[
      ...contract.productionTruth.verifierOnlyPaths,
      'tests/example.test.mjs',
      'docs/changes/example.md',
      'brain/learning/example.json',
      '.github/workflows/example.yml',
    ],
  });
  assert.equal(result.ok,true);
  assert.equal(result.mode,'safe-descendant');
  assert.deepEqual(result.unsafePaths,[]);
});

test('real runtime paths remain unsafe for production supersession', () => {
  const result=evaluateSafeProductionSupersession({
    expectedCommit:'a'.repeat(40),
    observedCommit:'b'.repeat(40),
    expectedIsAncestor:true,
    changedPaths:['prijzen.html','netlify/functions/growth-event.mjs'],
  });
  assert.equal(result.ok,false);
  assert.equal(result.mode,'runtime-affecting-descendant');
  assert.deepEqual(result.unsafePaths,['prijzen.html','netlify/functions/growth-event.mjs']);
});

test('built pricing readback regression contains encoded ampersand fixture', () => {
  const fixture=fs.readFileSync('tools/site-shell/test-live-contract.mjs','utf8');
  assert.match(fixture,/Directie &amp; AI Workshop/);
  const contractSource=fs.readFileSync('tools/site-shell/live-contract.mjs','utf8');
  const semanticEntityHandling =
    (/parse5/.test(contractSource) && /headingTexts/.test(contractSource)) ||
    (/encodeHtmlText/.test(contractSource) && /hasHeadingText/.test(contractSource));
  assert.equal(semanticEntityHandling,true,'live pricing verifier must normalize visible heading entity encoding semantically');
});


test('obligation terminalizer consumes canonical verifier-only path authority', () => {
  const workflow=fs.readFileSync('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(workflow,/brain\/contracts\/production-readback-v1\.json/);
  assert.match(workflow,/productionTruth\?\.verifierOnlyPaths/);
  assert.match(workflow,/grep -Fxq -- "\$1"/);
});


test('Netlify runtime applicability is contract-owned and covers production build writers', () => {
  assert.deepEqual([...NETLIFY_RUNTIME_PREFIXES], contract.productionTruth.netlifyRuntimePrefixes);
  assert.deepEqual([...NETLIFY_RUNTIME_EXACT], contract.productionTruth.netlifyRuntimePaths);
  assert.equal(isNetlifyRuntimePath('tools/site-shell/apply-commercial-pricing-v1.mjs'), true);
  assert.equal(isNetlifyRuntimePath('config/bg-static-i18n-en.d/example.json'), true);
  assert.equal(isNetlifyRuntimePath('netlify/functions/example.mjs'), true);
  assert.equal(isNetlifyRuntimePath('tools/site-shell/live-contract.mjs'), false, 'verifier-only paths must not demand a deployment');
  assert.equal(isNetlifyRuntimePath('tests/example.test.mjs'), false);
});

test('obligation terminalizer delegates Netlify runtime applicability to the shared classifier', () => {
  const workflow=fs.readFileSync('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8');
  assert.match(workflow,/isNetlifyRuntimePath/);
  assert.match(workflow,/production-supersession\.mjs/);
  assert.doesNotMatch(workflow,/netlify\/functions\/\*\|platform\/api\/\*/);
});
