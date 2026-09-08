import test from 'node:test';
import assert from 'node:assert/strict';
import {WIZARD_CSS,renderWizardShell} from '../assets/js/koppelingen/view.js';

test('all wizard controls meet the 44px touch target baseline',()=>{
  assert.match(WIZARD_CSS,/\.bg-kw button,.bg-kw textarea,.bg-kw select(?:,.bg-kw summary)?\{min-height:44px\}/);
});

test('mobile layout collapses routes templates and evidence to one column',()=>{
  assert.match(WIZARD_CSS,/@media\(max-width:700px\)/);
  assert.match(WIZARD_CSS,/\.bg-kw__routes,.bg-kw__templates,.bg-kw__evidence-flow\{grid-template-columns:1fr\}/);
});

test('essential help is available through a real button, not hover text',()=>{
  const html=renderWizardShell();
  assert.match(html,/<button[^>]+data-bg-help[^>]+aria-controls="bg-kw-help"/);
  assert.match(html,/id="bg-kw-help"/);
  assert.doesNotMatch(WIZARD_CSS,/:hover[^}]*content\s*:/);
});

test('mobile user can inspect live safe-test evidence without opening technical details',()=>{
  const html=renderWizardShell();
  assert.match(html,/data-bg-evidence/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/Activeer koppeling/);
});
