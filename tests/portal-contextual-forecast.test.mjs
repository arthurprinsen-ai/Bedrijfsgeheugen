import test from 'node:test';
import assert from 'node:assert/strict';
import { renderForecastPanel } from '../portal/forecast-panel.mjs';

test('does not invent predictions when no verified forecast data exists', () => {
  const html=renderForecastPanel({}, 'today');
  assert.match(html,/Nog geen geverifieerde voorspelling/);
  assert.doesNotMatch(html,/<svg /);
});
test('renders source-backed forecast and what-if controls on Today', () => {
  const state={forecasts:[{id:'rev',metric:'revenue',title:'Omzet',unit:'EUR',source:'ERP',model:'time series v1',updatedAt:'2026-10-14',verified:true,history:[{date:'aug',value:100},{date:'sep',value:110}],forecast:[{date:'okt',value:115},{date:'nov',value:125}]}]};
  const html=renderForecastPanel(state,'today');
  assert.match(html, /Interactieve voorspellingen/);
  assert.match(html, /data-forecast="horizon"/);
  assert.match(html, /data-forecast="adjustment"/);
  assert.match(html, /ERP/);
  assert.match(html, /time series v1/);
  assert.match(html, /<svg /);
});
test('does not expose irrelevant forecast on an unrelated page', () => {
  const state={forecasts:[{id:'risk',metric:'risk',source:'Register',verified:true,updatedAt:'2026-10-14',history:[{date:'a',value:1}],forecast:[{date:'b',value:2}]}]};
  assert.match(renderForecastPanel(state,'today'),/Nog geen geverifieerde voorspelling/);
  assert.match(renderForecastPanel(state,'intelligence'),/<svg /);
});
test('rejects incomplete forecast point data', () => {
  const state={forecasts:[{metric:'revenue',history:[{date:'a',value:null}],forecast:[{date:'b',value:9}]}]};
  assert.doesNotMatch(renderForecastPanel(state,'today'),/<svg /);
});

test('scenario projection remains bounded within the SVG chart and retains historical anchor', async () => {
  const { bindForecastControls }=await import('../portal/forecast-panel.mjs');
  const input={dataset:{forecast:'adjustment'},value:'20',addEventListener(type,handler){this.handler=handler;}};
  bindForecastControls({querySelectorAll:()=>[input]},()=>{});
  input.handler({currentTarget:input});
  const state={forecasts:[{id:'rev',metric:'revenue',source:'ERP',model:'validated-model',updatedAt:'2026-10-14',verified:true,history:[{date:'aug',value:100},{date:'sep',value:110}],forecast:[{date:'okt',value:160},{date:'nov',value:180}]}]};
  const html=renderForecastPanel(state,'today');
  const line=html.match(/<polyline points="([^"]+)" fill="none" stroke="#a65de2"/);
  assert.ok(line,'scenario polyline exists');
  const coords=line[1].split(' ').map(pair=>pair.split(',').map(Number));
  assert.ok(coords.every(([x,y])=>x>=0&&x<=720&&y>=0&&y<=205));
  const baseline=(178-(110-100)/(216-100)*145);
  assert.ok(Math.abs(coords[0][1]-baseline)<0.01,'scenario starts at unchanged historical point');
  input.value='0';input.handler({currentTarget:input});
});

test('does not plot unverified forecasts even with numeric series', () => {
  const state={forecasts:[{metric:'revenue',source:'Unverified',updatedAt:'2026-10-14',verified:false,history:[{date:'a',value:100}],forecast:[{date:'b',value:110}]}]};
  assert.doesNotMatch(renderForecastPanel(state,'today'),/<svg /);
});
