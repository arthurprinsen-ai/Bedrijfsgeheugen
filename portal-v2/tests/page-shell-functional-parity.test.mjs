import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../page-shell.js',import.meta.url),'utf8');

test('page shell imports the real functional-suite workspace',()=>{
  assert.match(source,/import\s*\{[^}]*mountFunctionalWorkspace[^}]*listFunctionalSuitePages[^}]*\}\s*from\s*['"]\.\/modules\/functional-suite\.js['"]/s);
});

test('protected functional-suite pages dispatch through mountFunctionalWorkspace instead of generic native rendering',()=>{
  assert.match(source,/FUNCTIONAL_SUITE_PAGES\s*=\s*new Set\(listFunctionalSuitePages\(\)\)/);
  assert.match(source,/FUNCTIONAL_SUITE_PAGES\.has\(pageId\)[\s\S]{0,400}mountFunctionalWorkspace\(native,/);
});

test('canvassen keeps the canonical workspace shell and delegates to the specialist from workspace-shell',()=>{
  assert.doesNotMatch(source,/import\s*\{[^}]*mountCanvasWorkspace[^}]*\}\s*from\s*['"]\.\/modules\/canvas-workspace\.js['"]/s);
  assert.match(source,/pageId===['"]canvassen['"][\s\S]{0,350}mountWorkspace\(native,contract,/);
});

test('generic protected-capability fallback cannot preempt functional-suite or canvas routing',()=>{
  const functionalIndex=source.indexOf('FUNCTIONAL_SUITE_PAGES.has(pageId)');
  const canvasIndex=source.indexOf("pageId==='canvassen'");
  const genericIndex=source.indexOf('else if(contract?.legacyCapability){');
  assert.ok(functionalIndex>0,'functional-suite dispatch missing');
  assert.ok(canvasIndex>0,'canvas dispatch missing');
  assert.ok(genericIndex>functionalIndex,'generic fallback must occur after functional dispatch');
  assert.ok(genericIndex>canvasIndex,'generic fallback must occur after canvas dispatch');
});
