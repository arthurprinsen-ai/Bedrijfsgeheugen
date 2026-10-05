import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow=fs.readFileSync('.github/workflows/supabase-supported-migration-repair-3742.yml','utf8');
const bridge=fs.readFileSync('supabase/functions/supabase-migration-repair-bridge/index.ts','utf8');

assert.match(workflow,/id-token:\s*write/);
assert.match(workflow,/bedrijfsgeheugen-supabase-migration-repair-bridge/);
assert.match(workflow,/supabase-migration-repair-bridge/);
assert.match(workflow,/supabase migration list --db-url "\$SUPABASE_DB_URL"/);
assert.match(workflow,/supabase migration repair[\s\S]*--status applied --db-url "\$SUPABASE_DB_URL"/);
assert.doesNotMatch(workflow,/secrets\.SUPABASE_ACCESS_TOKEN/);
assert.doesNotMatch(workflow,/secrets\.(?:PRODUCTION_DB_PASSWORD|SUPABASE_DB_PASSWORD)/);
assert.doesNotMatch(workflow,/supabase link --project-ref/);

assert.match(bridge,/token\.actions\.githubusercontent\.com/);
assert.match(bridge,/payload\.repository !== expectedRepo/);
assert.match(bridge,/payload\.ref !== expectedRef/);
assert.match(bridge,/payload\.workflow_ref !== expectedWorkflowRef/);
assert.match(bridge,/payload\.sha/);
assert.match(bridge,/Deno\.env\.get\("SUPABASE_DB_URL"\)/);
assert.doesNotMatch(bridge,/supabase_migrations/);
assert.doesNotMatch(bridge,/schema_migrations/);
assert.doesNotMatch(bridge,/execute_sql|createClient|rpc\(/);

console.log('SUPABASE_MIGRATION_REPAIR_OIDC_TRANSPORT_CONTRACT_OK');
