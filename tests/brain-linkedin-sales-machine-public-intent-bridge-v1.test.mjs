import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('selfscan and checkout emit PII-free canonical growth intent',()=>{
  const scan=fs.readFileSync('zelfscan.html','utf8');
  const checkout=fs.readFileSync('afsluiten.html','utf8');
  // Selfscan now sends one anonymous baseline to the durable scan store (no contact data).
  assert.match(scan,/BGScanPersistence\.save\(payload\)/);
  assert.match(scan,/source_kind:'bedrijfslek_scan'/);
  assert.match(scan,/Geen naam, mail of telefoon/);
  assert.doesNotMatch(scan,/var payload=\{[^}]*(email|mail:|telefoon:|naam:)/);
  assert.match(checkout,/\/api\/growth-event/);
  assert.match(checkout,/event_type:'primary_cta_click'/);
  assert.match(checkout,/intent_id:'saas-checkout'/);
  assert.doesNotMatch(checkout,/growth-event[^]*company_name/);
});
