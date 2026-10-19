// Regression for Portal V2 navigation: querySelector() returns one element, not a NodeList.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const source=readFileSync(new URL('../portal/app.mjs',import.meta.url),'utf8');
const start=source.indexOf('function bindInteractions(){');
const end=source.indexOf('\nfunction openCommand()',start);
assert.ok(start>=0&&end>start,'portal event binder must exist');

test('navigation binds every route, without aborting remaining portal controls',()=>{
  const routes=[];
  const handlers=[];
  const entries=['today','decisions','intelligence'];
  const nodes=entries.map(route=>({
    dataset:{route},
    addEventListener(event,fn){if(event==='click')handlers.push({route,fn})}
  }));
  const root={};
  let forecastBound=false;
  const binder=runInNewContext('('+source.slice(start,end)+')',{
    document:root,
    appRender:()=>{},
    bindForecastControls:()=>{forecastBound=true},
    $:()=>null,
    $$:selector=>selector==='[data-route]'?nodes:[],
    navigate:route=>routes.push(route)
  });
  assert.doesNotThrow(()=>binder());
  assert.equal(forecastBound,true);
  assert.equal(handlers.length,3,'every navigation element must be registered');
  for(const item of handlers)item.fn();
  assert.deepEqual(routes,entries);
});
