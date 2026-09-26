import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
assert.ok(source.includes("const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1'"));
assert.ok(source.includes("COMPOSIO_BASE}/tools/execute/proxy"));
assert.ok(!source.includes("COMPOSIO_BASE.replace('/api/v3','')"));
console.log('Composio proxy URL uses the canonical base without substring mutation');
