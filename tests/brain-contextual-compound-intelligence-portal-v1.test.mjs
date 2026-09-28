import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const read=relative=>fs.readFileSync(new URL('../'+relative,import.meta.url),'utf8');

test('contextual portal exposes canonical compound intelligence evidence',()=>{
  const ui=read('portal-v2/foresight-context-ui.js');
  const api=read('netlify/functions/portal-prediction-intelligence.mjs');
  const css=read('portal-v2/foresight-context.css');
  assert.match(ui,/Compound Intelligence/);
  assert.match(ui,/Wordt Powerhouse aantoonbaar slimmer\?/);
  assert.match(ui,/selfImprovementPanel\(quality\.self_improvement\)/);
  assert.match(api,/powerhouse_self_improvement_control_v1/);
  assert.match(api,/self_improvement:selfImprovement/);
  assert.match(css,/\.fsv-improvement/);
});

test('compound intelligence projection preserves truth and control boundaries',()=>{
  const api=read('netlify/functions/portal-prediction-intelligence.mjs');
  const ui=read('portal-v2/foresight-context-ui.js');
  assert.match(api,/getUser/);
  assert.match(ui,/nooit als zekerheid/);
  assert.match(ui,/ongecontroleerd/);
});
