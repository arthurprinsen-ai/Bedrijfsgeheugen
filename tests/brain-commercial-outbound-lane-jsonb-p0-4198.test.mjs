import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts','utf8');

test('hourly channel evidence is a JSONB object and not a double-encoded JSON string',()=>{
 assert.match(source,/\$3::text::jsonb,\$4::text::jsonb/);
 assert.match(source,/evidence=evidence\|\|\$2::text::jsonb/);
 assert.doesNotMatch(source,/\$3::jsonb,\$4::jsonb/);
 assert.doesNotMatch(source,/evidence=evidence\|\|\$2::jsonb/);
});
test('single canonical scheduler and four independently held/eligible lanes unchanged',()=>{
 for(const ch of ['email','linkedin_dm','linkedin_comment','linkedin_like']){
   assert.ok(source.includes('lane:"'+ch+'"'));
 }
 assert.match(source,/Promise\.allSettled\(outboundLanes\.map/);
 assert.match(source,/provider_side_effect_verified:false/);
 assert.match(source,/PROVIDER_WRITE_NOT_AVAILABLE/);
 assert.doesNotMatch(source,/cron\.schedule|setInterval\(|GMAIL_SEND_EMAIL|SALESROBOT_SEND_MESSAGE/);
});
