import assert from 'node:assert/strict';
import fs from 'node:fs';

const setup=fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const migration=fs.readFileSync('supabase/migration-history/repository-only/20260927153500_social_daily_self_healing_v1.sql','utf8');

assert.match(setup,/ALIAS='bedrijfsgeheugen-company-canonical'/);
assert.match(setup,/COMPANY_PROOF_RECORD='linkedin-company-oauth-fresh-proof-v1'/);
assert.match(setup,/COMPANY_REQUIRED_SCOPES=\['r_organization_admin','w_organization_social'\]/);
assert.match(setup,/LINKEDIN_GET_COMPANY_INFO/);
assert.match(setup,/COMPOSIO_LINKEDIN_CONNECTION_AMBIGUOUS/);
assert.match(setup,/COMPOSIO_LINKEDIN_REAUTH_REQUIRED/);
assert.match(setup,/proofAccountId\?healthy\.filter/);

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
