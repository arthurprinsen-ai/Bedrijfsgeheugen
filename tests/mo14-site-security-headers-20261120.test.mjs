import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hashesForInlineScripts,securityHeadersForHtml} from '../tools/security/build-mo14-headers.mjs';
const contents=['zaalplanner','veldplanner'].map(path=>[path,readFileSync('pw-mo14-1/'+path+'/index.html','utf8')]);
const headers=securityHeadersForHtml(contents);
test('each public coach route receives an exact-script-hash CSP without unsafe-inline JS',()=>{
 for(const [path,html] of contents){
  const hashes=hashesForInlineScripts(html,path);
  assert.equal(hashes.length,1);
  assert.ok(headers.includes('/'+path+'/*'));
  assert.ok(headers.includes("script-src 'self' "+hashes.join(' ')));
 }
 assert.equal((headers.match(/Content-Security-Policy:/g)||[]).length,3);
 assert.doesNotMatch(headers,/script-src\s+[^;\n]*'unsafe-inline'/);
 assert.doesNotMatch(headers,/script-src\s+[^\n]*'unsafe-eval'/);
 assert.match(headers,/frame-ancestors 'none'/);
 assert.match(headers,/X-Frame-Options: DENY/);
 assert.match(headers,/X-Content-Type-Options: nosniff/);
 assert.match(headers,/Strict-Transport-Security: max-age=31536000/);
 assert.match(headers,/Referrer-Policy: no-referrer/);
 assert.match(headers,/Cache-Control: no-store/);
 assert.doesNotMatch(headers,/^\s*\/\*\s*$/m);
});
test('CSP must reject remote scripts and malformed or ambiguous inline script inventory',()=>{
 assert.throws(()=>hashesForInlineScripts('<script src="https://attacker.invalid/hack.js"></script><script>console.log(1)</script>','zaalplanner'),/Untrusted script source/);
 assert.throws(()=>hashesForInlineScripts('<script>1</script><script>2</script>','zaalplanner'),/exactly one/);
 assert.throws(()=>hashesForInlineScripts('<div>no script</div>','zaalplanner'),/exactly one/);
});
test('no dangerous inline event handlers or foreign script src in actual coach HTML',()=>{
 for(const [path,html] of contents){
  const before=html.slice(0,html.indexOf('<script>')); // template-generated nodes are checked by the CSP at execution
  assert.doesNotMatch(before,/\son(?:load|click|error|submit|focus|change)\s*=/i,path);
 }
});

test('shared-origin legacy PW homepage rejects external webhook transfer and inline scripts',()=>{
 const root=headers.match(/(?:^|\n)\/\n  Content-Security-Policy: ([^\n]+)/)?.[1];
 assert.ok(root,'root homepage security header required because it shares origin with youth coach');
 assert.match(root,/script-src 'self'; script-src-attr 'none'/);
 assert.match(root,/connect-src 'self'/);
 assert.match(root,/frame-ancestors 'none'/);
 assert.doesNotMatch(root,/https?:|unsafe-eval|(?:script-src [^;]*unsafe-inline)/);
 assert.match(headers,/\n\s*X-Robots-Tag: noindex, nofollow, noarchive/);
});
