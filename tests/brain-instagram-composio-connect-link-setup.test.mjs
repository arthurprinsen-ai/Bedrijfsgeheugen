import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('supabase/functions/powerhouse-composio-instagram-setup/index.ts','utf8');
test('setup controller is admin-token guarded and never returns api key',()=>{assert.match(s,/powerhouse_daily_scheduler_token/);assert.match(s,/x-powerhouse-token/);assert.match(s,/COMPOSIO_API_KEY/);assert.doesNotMatch(s,/api_key\s*:\s*key/);});
test('managed Instagram setup uses current Composio v3.1 connect-link flow',()=>{assert.match(s,/api\/v3\.1/);assert.match(s,/toolkit_slug=instagram/);assert.match(s,/use_composio_managed_auth/);assert.match(s,/connected_accounts\/link/);assert.match(s,/user_id:USER_ID/);});
test('setup fails closed on ambiguity and missing auth',()=>{assert.match(s,/COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS/);assert.match(s,/COMPOSIO_INSTAGRAM_AUTH_CONFIG_AMBIGUOUS/);assert.match(s,/BLOCKED_EXTERNAL_CONFIG/);});
