import assert from 'node:assert/strict';
import fs from 'node:fs';

const setup=fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const migration=fs.readFileSync('supabase/migration-history/repository-only/20260927153500_social_daily_self_healing_v1.sql','utf8');

// Current setup contract: exactly one healthy connection may be selected (fresh OAuth proof first,
// then the bound OAuth account, then the canonical alias); anything else blocks as ambiguous.
assert.match(setup,/const selectable=proofHealthy\.length===1\?proofHealthy:\(boundHealthy\.length===1\?boundHealthy:\(canonical\.length===1\?canonical:healthy\)\)/);
assert.match(setup,/if\(selectable\.length!==1\)/);
assert.match(setup,/COMPOSIO_LINKEDIN_CONNECTION_AMBIGUOUS/);
assert.match(setup,/COMPOSIO_LINKEDIN_BOUND_OAUTH_NOT_HEALTHY/);
assert.match(setup,/BLOCKED_AMBIGUOUS/);
assert.match(setup,/COMPOSIO_LINKEDIN_REAUTH_REQUIRED/);

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
