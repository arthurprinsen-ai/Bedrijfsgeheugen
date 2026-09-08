import test from 'node:test';
import assert from 'node:assert/strict';
import {renderWizardShell,renderEvidenceFlow,wizardStyles} from '../assets/js/koppelingen/view.js';

test('wizard starts with three simple routes in the required order',()=>{
  const html=renderWizardShell();
  const a=html.indexOf('Vertel wat je wilt koppelen');
  const b=html.indexOf('Kies een voorbeeld');
  const c=html.indexOf('Bouw zelf');
  assert.ok(a>=0&&b>a&&c>b);
});

test('wizard exposes the plain-language AI prompt and primary action',()=>{
  const html=renderWizardShell();
  assert.match(html,/Wat wil je automatisch laten gebeuren\?/);
  assert.match(html,/Maak mijn koppeling/);
});

test('wizard renders six semantic progress steps and tap-accessible help',()=>{
  const html=renderWizardShell();
  for(const label of ['Bron','Selectie','Informatie','Doel','Planning','Test'])assert.match(html,new RegExp(`>${label}<`));
  assert.match(html,/<button[^>]+data-bg-help[^>]*>\?<\/button>/);
  assert.doesNotMatch(html,/title="[^"]+"/);
  assert.match(wizardStyles(),/min-height:44px/);
  assert.match(wizardStyles(),/@media\(max-width:700px\)/);
});

test('activation has a visible evidence reason and is not silently enabled',()=>{
  const html=renderWizardShell();
  assert.match(html,/Eerst een veilige test uitvoeren/);
  assert.match(html,/data-bg-activate[^>]+disabled/);
});

test('successful safe-test renders the four ordered evidence stages',()=>{
  const html=renderEvidenceFlow({
    executionId:'exec-1',
    stages:[
      {name:'source',ok:true,evidenceId:'s-1'},
      {name:'extractor',ok:true,evidenceId:'e-1'},
      {name:'validation',ok:true,evidenceId:'v-1'},
      {name:'target',ok:true,evidenceId:'t-1'}
    ]
  });
  const source=html.indexOf('Bron gelezen');
  const extractor=html.indexOf('Informatie herkend');
  const validation=html.indexOf('Gecontroleerd');
  const target=html.indexOf('Bestemming getest');
  assert.ok(source>=0&&extractor>source&&validation>extractor&&target>validation);
  assert.match(html,/exec-1/);
  assert.doesNotMatch(html,/secret|password|api[_-]?key/i);
});

test('wizard contains a dedicated live evidence region',()=>{
  const html=renderWizardShell();
  assert.match(html,/data-bg-evidence/);
  assert.match(html,/aria-live="polite"/);
});
