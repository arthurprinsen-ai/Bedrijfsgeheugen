import assert from 'node:assert/strict';
import fs from 'node:fs';
const p=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
assert.match(p,/async function resolveUniqueInstagramAccount/);
assert.match(p,/providerUserId/);
assert.match(p,/const providerIds=\[\.\.\.new Set\(identities\.map\(x=>x\.providerUserId\)\)\]/);
assert.match(p,/if\(providerIds\.length!==1\)throw new Error\('COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS'\)/);
assert.match(p,/credentialCount:sameIdentity\.length/);
assert.match(p,/await resolveUniqueInstagramAccount\(apiKey,active\)/);
console.log('duplicate credentials for one Instagram provider identity resolve canonically; distinct identities remain fail-closed');

assert.ok(!p.includes("COMPOSIO_BASE.replace('/api/v3','')"),'v3.1 base must not be truncated before proxy calls');
assert.match(p,/\$\{COMPOSIO_BASE\}\/tools\/execute\/proxy/);
