import assert from 'node:assert/strict';
import fs from 'node:fs';

const setup=fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20260927153500_social_daily_self_healing_v1.sql','utf8');

assert.match(setup,/LINKEDIN_CANONICAL_PERSON_URN='urn:li:person:N1twnCNCrD'/);
assert.match(setup,/probe-canonical-member-and-prefer-canonical-alias-v1/);
assert.doesNotMatch(setup,/if\(accounts\.length>1\).*CONNECTION_AMBIGUOUS/s);
assert.match(setup,/COMPOSIO_LINKEDIN_NO_HEALTHY_CANONICAL_CONNECTION/);

assert.match(publisher,/active_discovery/);
assert.match(publisher,/LINKEDIN_REAUTH_REQUIRED/);
assert.match(publisher,/expectedPersonId/);
assert.match(publisher,/connected_accounts\?toolkit_slugs=linkedin/);

assert.match(migration,/powerhouse_ensure_personal_source_rotation_v1/);
assert.match(migration,/verbatim_reuse_forbidden/);
assert.match(migration,/new_angle_required/);
assert.match(migration,/no_business_bridge/);
assert.match(migration,/powerhouse_content_closed_loop_tick_v1/);
assert.match(migration,/five-minute-self-healing-loop/);

console.log('Daily social delivery self-healing contract locked');
