import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const cases=[
  ["20261005135000_powerhouse_human_commercial_orchestrator_v1.sql", "18876bf5a51efe00d948f6652899477535b910a4"],
  ["20260928161000_powerhouse_all_20_growth_plays_v3.sql", "409e3836129733c6443d6f27a59ad148a634220f"],
  ["20260928162600_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql", "fa911898c56c6f02cd24a85091c69d92c0ec4123"],
  ["20260928123500_powerhouse_growth_swarm_v1.sql", "e0e34c92aa5f622f6e4d9441f5b79f462eea3e3e"],
  ["20260928124000_powerhouse_growth_swarm_activation_v1.sql", "2b842dc2aa3d2b17ea437b453af3bfef71fdb876"],
  ["20260929212500_powerhouse_loop_assurance_v3.sql", "0a3eeaa971e3acd2fbac58087019fc8244102036"],
  ["20260918103100_action_evidence_obligations_v1.sql", "8e48ff68d930f2d33d94092baaa255d2e36d8ca0"],
  ["20260918100000_powerhouse_dataforseo_intelligence_schedule_v1.sql", "716cdf257c9017aeaaeb5533a0cdbc6bd1b18ec5"],
  ["20260915140200_powerhouse_full_cycle_status_normalization_v1.sql", "3e9ab3d880e03a75cd915c95397ee76db33cd22a"],
  ["20260915140300_powerhouse_forecast_calibrator_timing_gap_fix_v1.sql", "b2dcfb81a3773363fba0bf177bc34c27183cc318"],
  ["20260915170000_powerhouse_tenant_identity_hardening_v1.sql", "50d899bfa0569cf17661804b8a142cb4aa42d808"],
];
for(const [filename,sha] of cases){
  test('immutable historical SQL '+filename,()=>{
    const root='supabase/migration-history/repository-only/'+filename;
    const bytes=readFileSync(root);
    assert.ok(bytes.toString('utf8').trim());
    assert.equal(createHash('sha1').update(Buffer.from('blob '+bytes.length+String.fromCharCode(0))).update(bytes).digest('hex'),sha);
    assert.equal(existsSync('supabase/migrations/'+filename),false);
  });
}
test("original tests read archive: tests/brain-human-commercial-orchestrator-v1.test.mjs",()=>{const s=readFileSync("tests/brain-human-commercial-orchestrator-v1.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20261005135000_powerhouse_human_commercial_orchestrator_v1.sql"));});
test("original tests read archive: tests/brain-powerhouse-all-20-growth-plays-v3.test.mjs",()=>{const s=readFileSync("tests/brain-powerhouse-all-20-growth-plays-v3.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260928161000_powerhouse_all_20_growth_plays_v3.sql"));});
test("original tests read archive: tests/brain-powerhouse-growth-plays-20of20-v1.test.mjs",()=>{const s=readFileSync("tests/brain-powerhouse-growth-plays-20of20-v1.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260928162600_powerhouse_growth_plays_20of20_persuasion_extension_v1.sql"));});
test("original tests read archive: tests/brain-powerhouse-growth-swarm-v1.test.mjs",()=>{const s=readFileSync("tests/brain-powerhouse-growth-swarm-v1.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260928123500_powerhouse_growth_swarm_v1.sql"));assert.ok(s.includes("supabase/migration-history/repository-only/20260928124000_powerhouse_growth_swarm_activation_v1.sql"));});
test("original tests read archive: tests/brain-powerhouse-loop-assurance-v3.test.mjs",()=>{const s=readFileSync("tests/brain-powerhouse-loop-assurance-v3.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260929212500_powerhouse_loop_assurance_v3.sql"));});
test("original tests read archive: tests/supabase-action-evidence-obligations-v1.test.mjs",()=>{const s=readFileSync("tests/supabase-action-evidence-obligations-v1.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260918103100_action_evidence_obligations_v1.sql"));});
test("original tests read archive: tests/supabase-powerhouse-dataforseo-intelligence-v1.test.mjs",()=>{const s=readFileSync("tests/supabase-powerhouse-dataforseo-intelligence-v1.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260918100000_powerhouse_dataforseo_intelligence_schedule_v1.sql"));});
test("original tests read archive: tests/supabase-powerhouse-full-cycle-status-normalization.test.mjs",()=>{const s=readFileSync("tests/supabase-powerhouse-full-cycle-status-normalization.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260915140200_powerhouse_full_cycle_status_normalization_v1.sql"));assert.ok(s.includes("supabase/migration-history/repository-only/20260915140300_powerhouse_forecast_calibrator_timing_gap_fix_v1.sql"));});
test("original tests read archive: tests/supabase-powerhouse-growth-swarm-v1.test.mjs",()=>{const s=readFileSync("tests/supabase-powerhouse-growth-swarm-v1.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260928123500_powerhouse_growth_swarm_v1.sql"));assert.ok(s.includes("supabase/migration-history/repository-only/20260928124000_powerhouse_growth_swarm_activation_v1.sql"));});
test("original tests read archive: tests/supabase-tenant-identity-hardening-contract.test.mjs",()=>{const s=readFileSync("tests/supabase-tenant-identity-hardening-contract.test.mjs",'utf8');assert.ok(s.includes("supabase/migration-history/repository-only/20260915170000_powerhouse_tenant_identity_hardening_v1.sql"));});
