import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
// Prove retired SQL is read from immutable repository-only archives, not re-executed.
const cases = [
  {
    "test": "brain-instagram-mira-winner-selection-v1.test.mjs",
    "sql": "20260920110000_instagram_daily_winner_lineage_v1.sql",
    "sha": "d66c4119fe0e75a4622f35fd7d420f31bd7dadf8"
  },
  {
    "test": "brain-human-commercial-orchestrator-v1.test.mjs",
    "sql": "20261005135000_powerhouse_human_commercial_orchestrator_v1.sql",
    "sha": "18876bf5a51efe00d948f6652899477535b910a4"
  },
  {
    "test": "brain-powerhouse-need-discovery-v1.test.mjs",
    "sql": "20260930202000_powerhouse_need_discovery_v1.sql",
    "sha": "90c466274bcbf1b368e361e461231530efda3570"
  },
  {
    "test": "brain-supabase-capture-trigger-execute-security-v1.test.mjs",
    "sql": "20260919123730_restrict_capture_trigger_execute_v1.sql",
    "sha": "6121995f1ca3727d47fa96e0e5b67817d745fc31"
  },
  {
    "test": "supabase-powerhouse-autonomous-trigger-fix.test.mjs",
    "sql": "20260915123500_powerhouse_autonomous_growth_revenue_trigger_fix.sql",
    "sha": "36e819b3903dc41528072454c79a17cabab5513b"
  },
  {
    "test": "supabase-powerhouse-autonomy-rpc-security.test.mjs",
    "sql": "20260915104000_powerhouse_autonomy_rpc_security_hardening.sql",
    "sha": "5a2433a155f965f085f5d7ea1dee6a996e30d3c2"
  },
  {
    "test": "supabase-powerhouse-internal-view-security.test.mjs",
    "sql": "20260915110000_powerhouse_internal_view_security_hardening.sql",
    "sha": "1aa3033564c25892814853701662c3ab104f0c0c"
  },
  {
    "test": "supabase-powerhouse-gap-register-security.test.mjs",
    "sql": "20260915110500_powerhouse_gap_register_security_hardening.sql",
    "sha": "2de1cf82e52aafae97deb132302400095dc7b1e1"
  },
  {
    "test": "supabase-powerhouse-linkedin-sales-prediction-activation.test.mjs",
    "sql": "20260915125800_powerhouse_linkedin_sales_prediction_activation_v1.sql",
    "sha": "8daf835dc5ff3f79fc11c7c4505755b436ed9522"
  },
  {
    "test": "supabase-powerhouse-signal-forecast-materialization.test.mjs",
    "sql": "20260915124500_powerhouse_signal_forecast_materialization.sql",
    "sha": "8610fdc4adafb5c3193cab5d2775a050e3f632dd"
  },
  {
    "test": "brain-autonomous-improvement-floor-terminal-v1.test.mjs",
    "sql": "20260920095700_autonomous_improvement_floor_terminal_v1.sql",
    "sha": "de5bc791c06080d2da3da8cc21c52bb808eebdad"
  },
  {
    "test": "brain-company-intelligence-os-v1.test.mjs",
    "sql": "20260928193000_powerhouse_company_intelligence_os_v1.sql",
    "sha": "a4758905425f0964338371247343192e3ed4cd73"
  },
  {
    "test": "brain-control-plane-monotonic-terminal-v1.test.mjs",
    "sql": "20260918141000_powerhouse_control_plane_monotonic_terminal_v1.sql",
    "sha": "d005ca4d3d0aeef45ffe4efe06a414f9377d8bf3"
  },
  {
    "test": "brain-one-million-revenue-operating-contract-v1.test.mjs",
    "sql": "20260929162000_powerhouse_one_million_revenue_operating_contract_v1.sql",
    "sha": "f37aa930e2f2b89602a6878fc4714a88c5e46392"
  },
  {
    "test": "brain-rocket-revenue-event-spine-v1.test.mjs",
    "sql": "20261005113000_powerhouse_rocket_revenue_event_spine_v1.sql",
    "sha": "ec95d7199b06974bb0e3cbe31c1c74407024e292"
  },
  {
    "test": "brain-social-publish-atomic-claim-dedupe-v1.test.mjs",
    "sql": "20260917235907_social_content_integrity_invalidation_guard.sql",
    "sha": "c653d64b4724fb654f610effd2ce6422c17269e9"
  },
  {
    "test": "brain-terminal-autonomous-reconciler-v1.test.mjs",
    "sql": "20260920095500_terminal_autonomous_reconciler_v1.sql",
    "sha": "bc0cbe3c7a830c13872cf5bc4cb1f858c37f0a32"
  },
  {
    "test": "brain-trigger-based-mkb-acquisition-runtime-v1.test.mjs",
    "sql": "20260924131500_trigger_based_mkb_acquisition_runtime_v1.sql",
    "sha": "a6037047760fe281ab24298f9f7d94c62cc95695"
  }
];
for (const {test: sourceTest,sql,sha} of cases) {
  test(`archived SQL source identity: ${sql}`, () => {
    const oldPath = `supabase/migrations/${sql}`;
    const archived = `supabase/migration-history/repository-only/${sql}`;
    const source = readFileSync(`tests/${sourceTest}`,'utf8');
    assert.equal(source.includes(oldPath),false,'retired executable migration read path must not return');
    assert.ok(source.includes(archived),'test must read authenticated historical SQL archive');
    assert.equal(existsSync(oldPath),false,'no second executable migration');
    const blob = readFileSync(archived);
    assert.ok(blob.toString('utf8').trim().length>0,'no empty archive');
    const payload = Buffer.concat([Buffer.from(`blob ${blob.length}`),Buffer.from([0]),blob]);
    assert.equal(createHash('sha1').update(payload).digest('hex'),sha,'immutable original Git SQL blob');
  });
}
