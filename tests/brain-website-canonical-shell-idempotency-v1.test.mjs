import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPageMain, unwrapCanonicalPageContent } from '../tools/site-shell/apply-shell.mjs';

const payload='<section class="inhoud-kop"><h1>Modelwijzer</h1></section><section class="inhoud-body"><p>Inhoud</p></section>';
const once=`<main data-bg-component="main"><div class="bg-standalone-page" id="view-inhoud"><div class="page-inhoud">${payload}</div></div><aside class="bgx-lek">extra</aside></main>`;
const twice=`<main data-bg-component="main"><div class="bg-standalone-page" id="view-inhoud"><div class="page-inhoud"><div class="bg-standalone-page" id="view-inhoud"><div class="page-inhoud">${payload}</div></div></div></div></main>`;

test('canonical shell extraction unwraps one existing view wrapper',()=>{
  assert.equal(extractPageMain(once,'ai-modelwijzer.html'),payload);
});

test('canonical shell extraction collapses historical nested view wrappers',()=>{
  assert.equal(extractPageMain(twice,'ai-modelwijzer.html'),payload);
});

test('canonical page unwrapping is idempotent',()=>{
  assert.equal(unwrapCanonicalPageContent(payload),payload);
  assert.equal(unwrapCanonicalPageContent(extractPageMain(twice)),payload);
});
