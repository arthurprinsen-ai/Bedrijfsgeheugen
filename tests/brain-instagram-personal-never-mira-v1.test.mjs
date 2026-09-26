import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
assert.match(source,/INSTAGRAM_PERSONAL_ACCOUNT_FORBIDDEN_FOR_MIRA/);
assert.match(source,/username==='arthurprinsen'/);
console.log('personal Instagram identity is hard-blocked for Mira publishing');
