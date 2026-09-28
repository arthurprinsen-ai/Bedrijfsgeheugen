import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('selfscan and checkout emit PII-free canonical growth intent',()=>{
  const scan=fs.readFileSync('zelfscan.html','utf8');
  const checkout=fs.readFileSync('afsluiten.html','utf8');
  assert.match(scan,/\/api\/growth-event/);
  assert.match(scan,/event_type:'lead_outcome'/);
  assert.match(scan,/intent_id:'selfscan-report-request'/);
  assert.doesNotMatch(scan,/growth-event[^]*email:mail/);
  assert.match(checkout,/\/api\/growth-event/);
  assert.match(checkout,/event_type:'primary_cta_click'/);
  assert.match(checkout,/intent_id:'saas-checkout'/);
  assert.doesNotMatch(checkout,/growth-event[^]*company_name/);
});
