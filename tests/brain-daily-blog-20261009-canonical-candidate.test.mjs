import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('canonical 2026-10-09 actual live SOPV article is source-controlled and uniquely addressable', () => {
  const ledger=JSON.parse(fs.readFileSync('data/content-publication-ledger.json','utf8'));
  const daily=ledger.days?.['2026-10-09'];
  assert.ok(daily, 'Missing canonical publication date');
  assert.equal(daily.slug,'sopv-2026-plasticverwerkers-productietest-subsidie');
  assert.equal(daily.content_id,'blog:sopv-2026-plasticverwerkers-productietest-subsidie');
  const html=fs.readFileSync('blog/sopv-2026-plasticverwerkers-productietest-subsidie/index.html','utf8');
  assert.match(html,/data-content-id="blog:sopv-2026-plasticverwerkers-productietest-subsidie"/);
  assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/sopv-2026-plasticverwerkers-productietest-subsidie\//);
  assert.match(html,/<h1(?:\s|>)/);
  const redirects=fs.readFileSync('_redirects','utf8');
  assert.doesNotMatch(redirects,/^\/blog\/sopv-2026-plasticverwerkers-productietest-subsidie\/\s+/m);
  assert.match(redirects,/^\/blog\/onprijsd-probleem-bedrijfsvoering\/\s+\/blog\/ongeprijsd-probleem-bedrijfsvoering\/\s+301!/m);
  if(daily.state==='live'){
    assert.equal(daily.live_url,'https://www.bedrijfsgeheugen.nl/blog/sopv-2026-plasticverwerkers-productietest-subsidie/');
    assert.ok(daily.live_proof && typeof daily.live_proof==='object','Live status requires actual readback proof');
  } else {
    assert.equal(daily.live_proof,undefined,'Unproven candidate must not carry fabricated live evidence');
  }
});
