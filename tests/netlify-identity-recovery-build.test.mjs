import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { repairCustomerPortalAuth } from '../tools/customer-portal-auth-race.mjs';
import { transformIdentityTokenFlow } from '../tools/fix-netlify-identity-token-flow.mjs';

const source=fs.readFileSync(new URL('../klantportaal.html',import.meta.url),'utf8');
const built=transformIdentityTokenFlow(repairCustomerPortalAuth(source));

test('production auth build keeps token flow ahead of portal rendering',()=>{
  const guard=built.indexOf('const identityTokenFlow=');
  const init=built.indexOf("netlifyIdentity.on('init',u=>{ if(identityTokenFlow) return;");
  const render=built.indexOf('if(u) toonPortaal(u);',init);
  assert.ok(guard>=0);
  assert.ok(init>guard);
  assert.ok(render>init);
});

test('production auth build exposes recovery and invite UI handlers',()=>{
  assert.match(built,/netlifyIdentity\.on\('recovery',\(\)=>\{ netlifyIdentity\.open\('recovery'\); \}\);/);
  assert.match(built,/netlifyIdentity\.on\('invite',\(\)=>\{ netlifyIdentity\.open\('signup'\); \}\);/);
});
