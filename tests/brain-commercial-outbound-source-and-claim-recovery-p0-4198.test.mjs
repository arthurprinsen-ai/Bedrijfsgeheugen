import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runner=readFileSync('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts','utf8');
const migration=readFileSync('supabase/migrations/20261011163200_brain_outbound_exact_source_eligibility_p0_4198.sql','utf8');

test('one canonical Heartbeat materializes the original Brain candidates before evaluating outbound lanes',()=>{
  assert.match(runner,/public\.powerhouse_materialize_command_center_actions_v1\(\$1::date\)/);
  assert.match(runner,/const brainActionFeed=await materializeCommercialIntent\(\);\s+const outboundLanesResult=await runOutboundLanes\(\);/);
  assert.match(runner,/pg_try_advisory_xact_lock/);
  assert.match(runner,/commercial-intent-materialization:/);
  assert.match(runner,/statement_timeout = '16000ms'/);
  assert.doesNotMatch(runner,/cron\.schedule\(|setInterval\(|GMAIL_SEND_EMAIL|SALESROBOT_SEND_MESSAGE/);
});

test('lack of approved candidates never consumes future same-hour send authority',()=>{
  assert.match(runner,/on conflict \(dedupe_key\) do update set evidence=excluded\.evidence/);
  assert.match(runner,/where excluded\.evidence->>'decision'='READY'/);
  assert.match(runner,/NO_ELIGIBLE_APPROVED_ACTION/);
  assert.match(runner,/ALREADY_EVALUATED_THIS_HOUR/);
  assert.match(runner,/runOneOutboundLane/);
  assert.match(runner,/Promise\.allSettled/);
});

test('events store machine-readable JSONB, no double-stringified evidence or invented provider side effect',()=>{
  assert.match(runner,/jsonb_build_object\('contract','powerhouse-independent-commercial-lanes-v2'/);
  assert.match(runner,/jsonb_build_object\('queued',\$2::boolean,'request_id',\$3::bigint,'reason',\$4::text\)/);
  assert.match(runner,/provider_side_effect_verified',false/);
  assert.match(runner,/PROVIDER_RESULT_PENDING_READBACK/);
  assert.doesNotMatch(runner,/JSON\.stringify\(\{contract:"powerhouse-independent-commercial-lanes-v1"/);
});

test('Brain cannot turn generic web articles into LinkedIn comments or disconnected prospects into DMs',()=>{
  assert.match(migration,/linkedin[.]com\/(posts\\/\|feed\\/update\\/\|pulse\\/)/);
  assert.match(migration,/\^urn:li:\(share\|ugcPost\):\[0-9\]\+\$/);
  assert.match(migration,/linkedin_connection_status/);
  assert.match(migration,/linkedin_is_connected/);
  assert.match(migration,/linkedin_first_degree_verified/);
  assert.match(migration,/'linkedin_post_urn',case when r\.social_source_ready/);
  assert.match(runner,/linkedIn.*post_urn|linkedin_post_urn/);
});

test('canonical source guards, existing consent / quality and service-only execution retained',()=>{
  assert.match(migration,/coalesce\(s\.pressure_state,'ready'\) not in \('cooldown','wait','suppressed','do_not_contact'\)/);
  assert.match(migration,/coalesce\(s\.identity_conflict,false\)=false/);
  assert.match(migration,/on conflict\(dedupe_key\) do update/);
  assert.match(migration,/REVOKE EXECUTE ON FUNCTION public\.powerhouse_materialize_command_center_actions_v1\(date\)/);
  assert.match(migration,/TO service_role/);
  assert.doesNotMatch(migration,/cron\.schedule\(|net\.http_post\(|GMAIL_SEND_EMAIL/);
  assert.match(runner,/human_approved/);
  assert.match(runner,/PROVIDER_WRITE_NOT_AVAILABLE/);
});
