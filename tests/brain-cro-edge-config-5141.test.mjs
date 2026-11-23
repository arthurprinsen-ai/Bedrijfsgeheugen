import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

test('existing bg-interactie Edge function has exactly one enabled provider-authority declaration',()=>{
 const text=readFileSync('supabase/config.toml','utf8');
 const sections=[...text.matchAll(/^\[functions\.bg-interactie\]\s*$/gm)];
 assert.equal(sections.length,1,'exactly one source authority');
 const start=sections[0].index+sections[0][0].length;
 const block=text.slice(start).split(/^\[functions\./m)[0];
 assert.match(block,/^enabled\s*=\s*true\s*$/m);
 assert.match(block,/^verify_jwt\s*=\s*false\s*$/m);
 assert.match(block,/^entrypoint\s*=\s*"\.\/functions\/bg-interactie\/index\.ts"\s*$/m);
 assert.ok(existsSync('supabase/functions/bg-interactie/index.ts'));
});
test('raw ingress retains consent, origin and durable failure controls',()=>{
 const s=readFileSync('supabase/functions/bg-interactie/index.ts','utf8');
 assert.match(s,/ORIGINS/);
 assert.match(s,/DETAIL_GEBEURTENISSEN/);
 assert.match(s,/toestemming !== true/);
 assert.match(s,/onConflict: 'event_uid'/);
 assert.match(s,/status: 503/);
 assert.match(s,/Deno\.serve/);
});
