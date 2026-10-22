import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';

const records = [
  {
    "name": "20260919123730_restrict_capture_trigger_execute_v1.sql",
    "sha": "6121995f1ca3727d47fa96e0e5b67817d745fc31"
  },
  {
    "name": "20260915123500_powerhouse_autonomous_growth_revenue_trigger_fix.sql",
    "sha": "36e819b3903dc41528072454c79a17cabab5513b"
  },
  {
    "name": "20260915104000_powerhouse_autonomy_rpc_security_hardening.sql",
    "sha": "5a2433a155f965f085f5d7ea1dee6a996e30d3c2"
  },
  {
    "name": "20260915110500_powerhouse_gap_register_security_hardening.sql",
    "sha": "2de1cf82e52aafae97deb132302400095dc7b1e1"
  },
  {
    "name": "20260915110000_powerhouse_internal_view_security_hardening.sql",
    "sha": "1aa3033564c25892814853701662c3ab104f0c0c"
  },
  {
    "name": "20260915124500_powerhouse_signal_forecast_materialization.sql",
    "sha": "8610fdc4adafb5c3193cab5d2775a050e3f632dd"
  }
];

test('inherited security SQL contracts use immutable repository-only blobs without executable duplicates', () => {
  for (const {name,sha} of records) {
    const archive = 'supabase/migration-history/repository-only/' + name;
    const executable = 'supabase/migrations/' + name;
    assert.equal(existsSync(executable), false, 'historical SQL must not reappear as executable migration: ' + name);
    assert.equal(existsSync(archive), true, 'missing original archived SQL: ' + archive);
    const bytes = readFileSync(archive);
    assert.ok(bytes.length > 0, 'empty historic source: ' + name);
    const gitBlobSha = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    assert.equal(gitBlobSha, sha, 'archived immutable SQL blob has drifted: ' + name);
  }
});
