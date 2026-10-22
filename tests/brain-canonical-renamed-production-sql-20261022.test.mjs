import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const contracts = [
  {
    testFile: 'tests/brain-bedrijfslek-canonical-brain-v1.test.mjs',
    oldFile: 'supabase/migrations/20261009185500_bedrijfslek_runtime_signal_cycle_v1.sql',
    newFile: 'supabase/migrations/20261009190719_bedrijfslek_runtime_signal_cycle_v1.sql',
    markers: [
      'powerhouse_open_cycle_from_runtime_signal_v1',
      'powerhouse_runtime_signal_cycle_trigger_v1',
      "revoke all on function public.powerhouse_open_cycle_from_runtime_signal_v1(uuid)",
      "grant execute on function public.powerhouse_open_cycle_from_runtime_signal_v1(uuid) to service_role"
    ]
  },
  {
    testFile: 'tests/brain-outreach-4340-canonical-quality.test.mjs',
    oldFile: 'supabase/migrations/20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql',
    newFile: 'supabase/migrations/20261012074151_20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql',
    markers: [
      'powerhouse_email_contact_suppressions',
      'linkedin_dm',
      'source_specific_evidence_ok',
      'semantic_novelty_ok',
      'new_followup_evidence_ok'
    ]
  }
];

for (const contract of contracts) {
  test('renamed production SQL oracle preserves original contract: ' + contract.testFile, () => {
    assert.equal(fs.existsSync(contract.oldFile), false, 'Obsolete filename must not be restored as duplicate executable migration');
    const source = fs.readFileSync(contract.newFile, 'utf8');
    assert.ok(source.trim().length > 0, 'Canonical already-applied source must be nonempty');
    for (const marker of contract.markers) assert.ok(source.includes(marker), 'Preserve original safety marker: ' + marker);
    const consumer = fs.readFileSync(contract.testFile, 'utf8');
    assert.ok(consumer.includes(contract.newFile), 'Consumer must read the surviving canonical migration');
    assert.ok(!consumer.includes(contract.oldFile), 'Consumer must not read the retired filename');
  });
}
