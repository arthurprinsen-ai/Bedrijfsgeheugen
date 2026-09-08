import test from 'node:test';
import assert from 'node:assert/strict';
import {renderWizardShell} from '../assets/js/koppelingen/view.js';

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
});

test('activation has a visible evidence reason and is not silently enabled',()=>{
  const html=renderWizardShell();
  assert.match(html,/Eerst een veilige test uitvoeren/);
  assert.match(html,/data-bg-activate[^>]+disabled/);
});
