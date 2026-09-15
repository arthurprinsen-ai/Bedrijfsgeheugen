import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationUrl = new URL('../supabase/migrations/20260915154107_powerhouse_outcome_readback_health_semantics_v1.sql', import.meta.url);
const migration = fs.existsSync(migrationUrl) ? fs.readFileSync(migrationUrl, 'utf8') : '';

const has=(p,m)=>assert.match(migration,p,m);

test('executed actions awaiting observed outcomes are not research gaps',()=>{
  assert.ok(fs.existsSync(migrationUrl),'health semantics migration must exist');
  has(/executed_at\s+is\s+not\s+null/i,'executed-action state must be detected');
  has(/powerhouse_sales_outcomes/i,'observed outcome lineage must remain authoritative');
  has(/not\s+exists[\s\S]*powerhouse_sales_outcomes/i,'pending outcome must be distinguished from missing research');
});

test('health view stays fail-closed and security-invoker',()=>{
  has(/create\s+or\s+replace\s+view\s+public\.powerhouse_revenue_intelligence_health_v1/i,'canonical health view must be replaced in place');
  has(/alter\s+view\s+public\.powerhouse_revenue_intelligence_health_v1\s+set\s*\(security_invoker\s*=\s*true\)/i,'security_invoker must be explicit');
  has(/revoke\s+all\s+on\s+public\.powerhouse_revenue_intelligence_health_v1\s+from\s+anon,\s*authenticated/i,'browser roles must remain revoked');
  has(/outcome-readback-health-semantics-v1/i,'learning fingerprint must be persisted');
});
