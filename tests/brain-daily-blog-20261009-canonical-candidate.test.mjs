import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('canonical 2026-10-09 approved article is source-controlled and uniquely addressable', () => {
  const ledger=JSON.parse(fs.readFileSync('data/content-publication-ledger.json','utf8'));
  const daily=ledger.days?.['2026-10-09'];
  assert.ok(daily, 'Missing canonical publication date');
  assert.equal(daily.slug,'onprijsd-probleem-bedrijfsvoering');
  assert.equal(daily.content_id,'blog:onprijsd-probleem-bedrijfsvoering');
  const html=fs.readFileSync('blog/onprijsd-probleem-bedrijfsvoering/index.html','utf8');
  assert.match(html,/data-content-id="blog:onprijsd-probleem-bedrijfsvoering"/);
  assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/onprijsd-probleem-bedrijfsvoering\//);
  assert.match(html,/<h1(?:\s|>)/);
  if(daily.state==='live'){
    assert.equal(daily.live_url,'https://www.bedrijfsgeheugen.nl/blog/onprijsd-probleem-bedrijfsvoering/');
    assert.ok(daily.live_proof && typeof daily.live_proof==='object','Live status requires actual readback proof');
  } else {
    assert.equal(daily.live_proof,undefined,'Unproven candidate must not carry fabricated live evidence');
  }
});
