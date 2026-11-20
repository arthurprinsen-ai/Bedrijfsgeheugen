import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateHeaders,verifyTargets,TARGETS} from '../tools/security/verify-public-security-headers.mjs';
const MockHeaders=globalThis.Headers;
function header(mode){
 return new MockHeaders({
  'X-Content-Type-Options':'nosniff',
  'Strict-Transport-Security':'max-age=31536000',
  'X-Frame-Options':mode==='coach'?'DENY':'SAMEORIGIN',
  'Cache-Control':'private, no-store',
  'Content-Security-Policy':mode==='coach'
   ?"default-src 'none'; script-src 'self' 'sha256-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN12345='; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
   :"object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests"
 });
}
test('business and both coach security header contracts are explicit and scoped',()=>{
 assert.equal(TARGETS.length,3);
 assert.ok(evaluateHeaders(header('business'),'business').passed);
 assert.ok(evaluateHeaders(header('coach'),'coach').passed);
});
test('missing CSP and unsafe-inline scripts are rejected',()=>{
 const noCsp=header('coach');noCsp.delete('Content-Security-Policy');
 assert.ok(!evaluateHeaders(noCsp,'coach').passed);
 const weak=header('coach');weak.set('Content-Security-Policy',"script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 assert.ok(evaluateHeaders(weak,'coach').missing.includes('strict script hashes'));
 const weakB=header('business');weakB.set('X-Frame-Options','ALLOWALL');
 assert.ok(!evaluateHeaders(weakB,'business').passed);
});
test('read-only health check surfaces failed HTTP response without claiming success',async()=>{
 const tests=await verifyTargets([{name:'mock',url:'https://example.invalid/',mode:'business'}],async()=>({ok:false,status:503,headers:header('business')}));
 assert.equal(tests.length,1);assert.equal(tests[0].passed,false);
 assert.match(tests[0].missing[0],/HTTP 503/);
});
