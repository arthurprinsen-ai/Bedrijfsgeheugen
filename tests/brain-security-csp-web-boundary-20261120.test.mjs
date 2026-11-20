import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const headers=readFileSync('_headers','utf8');
const config=readFileSync('netlify.toml','utf8');
const globalHeader=headers.split('\n\n').find(part=>part.startsWith('/*\n'));
const globalToml=config.match(/\[\[headers\]\]\s+for = "\/\*"\s+\[headers\.values\]([\s\S]*?)(?=\n\[\[headers\]\]|$)/)?.[1];
const enforce="object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests";
const report="script-src 'self' https:; object-src 'none'; base-uri 'self'";

test('global Bedrijfsgeheugen CSP is a conservative enforced boundary, consistent in both Netlify configurations',()=>{
 assert.ok(globalHeader&&globalToml,'main scope exists');
 for(const source of [globalHeader,globalToml])for(const key of [enforce,report])assert.ok(source.includes(key),'header mismatch: '+key);
 assert.match(globalHeader,/X-Frame-Options: SAMEORIGIN/);
 assert.match(globalHeader,/X-Content-Type-Options: nosniff/);
 assert.match(globalHeader,/Strict-Transport-Security: max-age=31536000/);
 assert.match(globalToml,/X-Frame-Options = "SAMEORIGIN"/);
});
test('protected internal staff paths cannot be cached or framed by a third-party',()=>{
 const internal=headers.split('\n\n').find(part=>part.startsWith('/intern/*\n'));
 assert.ok(internal,'internal-specific headers missing');
 for(const term of ["Cache-Control: private, no-store","X-Robots-Tag: noindex","X-Frame-Options: DENY","frame-ancestors 'none'","Referrer-Policy: no-referrer"])assert.ok(internal.includes(term),term);
 assert.match(config,/\[\[edge_functions\]\][\s\S]*function = "intern-slot"[\s\S]*path = "\/intern\/\*"/);
});
test('full strict script CSP is only report-only until each legacy public route has an inventory',()=>{
 assert.doesNotMatch(globalHeader,/\n\s*Content-Security-Policy: [^\n]*script-src/);
 assert.match(globalHeader,/Content-Security-Policy-Report-Only: script-src/);
 assert.doesNotMatch(globalHeader,/Content-Security-Policy:.*unsafe-inline/);
});
