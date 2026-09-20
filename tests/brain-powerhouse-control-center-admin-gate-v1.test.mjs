import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isPowerhouseAdmin } from '../platform/auth/powerhouse-admin.mjs';

test('Powerhouse admin policy accepts admin roles and configured allowlist only',()=>{
  assert.equal(isPowerhouseAdmin({id:'1',roles:['powerhouse-admin'],email:'x@example.com'}),true);
  assert.equal(isPowerhouseAdmin({id:'1',roles:['member'],email:'admin@example.com'},{allowedEmails:'admin@example.com'}),true);
  assert.equal(isPowerhouseAdmin({id:'1',roles:['member'],email:'user@example.com'},{allowedEmails:'admin@example.com'}),false);
  assert.equal(isPowerhouseAdmin(null,{allowedEmails:'admin@example.com'}),false);
});

test('admin observability endpoint is fail closed and private',async()=>{
  const src=await readFile('netlify/functions/powerhouse-observability.mjs','utf8');
  assert.match(src,/POWERHOUSE_ADMIN_REQUIRED/);
  assert.match(src,/POWERHOUSE_ADMIN_EMAILS/);
  assert.match(src,/private, no-store/);
  assert.match(src,/x-robots-tag/);
  assert.doesNotMatch(src,/createOperatingLoopHandler/);
});

test('Control Center no longer consumes ordinary portal runtime evidence',async()=>{
  const src=await readFile('portal-v2/modules/powerhouse-observability.js','utf8');
  assert.match(src,/\/api\/powerhouse-observability/);
  assert.match(src,/authorization:\x60Bearer/);
  assert.match(src,/Geen toegang/);
  assert.match(src,/Inloggen vereist/);
  assert.doesNotMatch(src,/domainState\?\.get/);
});
