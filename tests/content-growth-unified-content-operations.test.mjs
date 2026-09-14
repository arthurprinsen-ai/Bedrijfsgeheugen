import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260914093000_unified_content_publication_operations.sql';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';
const singleTenantMigrationPath = 'supabase/migrations/20260914125000_single_content_operations_tenant.sql';
const singleTenantMigration = fs.existsSync(singleTenantMigrationPath) ? fs.readFileSync(singleTenantMigrationPath, 'utf8') : '';
const linkedinReconcileMigrationPath = 'supabase/migrations/20260914133500_linkedin_campaign_identity_reconciliation.sql';
const linkedinReconcileMigration = fs.existsSync(linkedinReconcileMigrationPath) ? fs.readFileSync(linkedinReconcileMigrationPath, 'utf8') : '';
const operationsApi = fs.readFileSync('supabase/functions/content-operations/index.ts', 'utf8');
const dailyApi = fs.readFileSync('supabase/functions/bg-dagoverzicht/index.ts', 'utf8');
const todayUi = fs.readFileSync('intern/vandaag/index.html', 'utf8');
const publisher = fs.readFileSync('scripts/publish_approved_blog_v2.py', 'utf8');
const workflow = fs.readFileSync('.github/workflows/approved-central-blog.yml', 'utf8');
const operationsWorkflow = fs.readFileSync('.github/workflows/unified-content-operations.yml', 'utf8');

test('calendar projects exactly 109 daily blog obligations through 31 Dec 2026', () => {
  assert.match(migration, /2026-09-14/);
  assert.match(migration, /2026-12-31/);
  assert.match(migration, /v_blog_count\s*<>\s*109/);
  assert.match(migration, /unique\s*\(tenant_id,\s*publication_date,\s*channel\)/i);
  assert.match(migration, /'linkedin_personal'/);
  assert.match(migration, /'linkedin_company'/);
  assert.match(migration, /'instagram'/);
  assert.match(migration, /'blog'/);
});

test('execution ledger is idempotent, deduplicated and has a unified cockpit', () => {
  assert.match(migration, /create table if not exists public\.content_publication_obligations/i);
  assert.match(migration, /create or replace function public\.sync_content_publication_obligations/i);
  assert.match(migration, /select distinct value as channel/i);
  assert.match(migration, /on conflict \(tenant_id, publication_date, channel\) do update/i);
  assert.match(migration, /create or replace view public\.content_operations_cockpit/i);
});

test('publication state cannot claim live without proof and cannot regress', () => {
  assert.match(migration, /create or replace function public\.record_content_publication_state/i);
  assert.match(migration, /LIVE_PROVEN/);
  assert.match(migration, /LIVE_PROOF_REQUIRED/);
  assert.match(migration, /STATE_REGRESSION_NOT_ALLOWED/);
});

test('Powerhouse content operations endpoint reads the canonical cockpit', () => {
  assert.match(operationsApi, /content_operations_cockpit/);
  assert.match(operationsApi, /Europe\/Amsterdam/);
  assert.match(operationsApi, /blogComing/);
  assert.match(operationsApi, /is_overdue/);
  assert.match(operationsApi, /x-powerhouse-token/);
});

test('existing Today cockpit exposes the same publication truth with the existing login', () => {
  assert.match(dailyApi, /body\?\.actie === 'content'/);
  assert.match(dailyApi, /content_operations_cockpit/);
  assert.match(dailyApi, /blog_komt/);
  assert.match(dailyApi, /x-bg-token/);
  assert.match(todayUi, /Content & publicatie/);
  assert.match(todayUi, /api\(\{actie:'content'\}\)/);
  assert.match(todayUi, /LinkedIn persoonlijk/);
  assert.match(todayUi, /Instagram/);
  assert.match(todayUi, /Blog/);
  assert.match(todayUi, /https:\/\/www\.bedrijfsgeheugen\.nl\/intern\/meetoverzicht\//);
});

test('content operations keeps one canonical execution tenant', () => {
  assert.match(singleTenantMigration, /delete from public\.content_publication_obligations where tenant_id = 'bedrijfsgeheugen'/i);
  assert.match(singleTenantMigration, /new\.tenant_id\s*:=\s*'canonical'/i);
  assert.match(singleTenantMigration, /e\.tenant_id\s*=\s*'canonical'/i);
  assert.match(singleTenantMigration, /CONTENT_OPERATIONS_ALIAS_DUPLICATION/);
  assert.match(singleTenantMigration, /p_tenant_id in \('canonical','bedrijfsgeheugen'\)/i);
  assert.match(operationsApi, /tenant.*'canonical'/);
  assert.match(dailyApi, /\.eq\('tenant_id',\s*'canonical'\)/);
  assert.doesNotMatch(operationsApi, /\|\|\s*'bedrijfsgeheugen'/);
  assert.doesNotMatch(dailyApi, /\.eq\('tenant_id',\s*'bedrijfsgeheugen'\)/);
});

test('approved blog publisher schedules daily and resolves an exact due slug before render', () => {
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron:\s*['"]\d+\s+\d+\s+\*\s+\*\s+\*['"]/);
  assert.match(workflow, /--select-due-slug/);
  assert.match(workflow, /RESOLVED_SLUG/);
  assert.match(publisher, /--select-due-slug/);
  assert.match(publisher, /def select_due_slug\(/);
  assert.match(publisher, /queue_contract\(row\)/);
  assert.match(publisher, /NO_DUE_BLOG/);
  assert.match(publisher, /learning-driven selection required; render must receive an exact approved slug/);
});

test('existing blog delivery remains candidate-only and never pushes direct to main', () => {
  assert.match(workflow, /production_authority=BG169/);
  assert.match(workflow, /direct_main_push=false/);
  assert.doesNotMatch(workflow, /git\s+push\s+origin\s+HEAD:main/);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge/);
});

test('LinkedIn publication reconciliation uses deterministic campaign identity without guessing legacy rows', () => {
  assert.match(linkedinReconcileMigration, /source_campaign_id\s+like\s+'li-personal-%'/i);
  assert.match(linkedinReconcileMigration, /source_campaign_id\s+like\s+'li-company-%'/i);
  assert.match(linkedinReconcileMigration, /then\s+'linkedin_personal'/i);
  assert.match(linkedinReconcileMigration, /then\s+'linkedin_company'/i);
  assert.match(linkedinReconcileMigration, /legacy LinkedIn row without deterministic identity/i);
  assert.match(linkedinReconcileMigration, /perform public\.record_content_publication_state/i);
  assert.match(linkedinReconcileMigration, /source_campaign_id/i);
  assert.match(operationsWorkflow, /20260914133500_linkedin_campaign_identity_reconciliation\.sql/);
});
