import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const duplicate='/blog/onprijsd-probleem-bedrijfsvoering/';
const canonical='/blog/ongeprijsd-probleem-bedrijfsvoering/';

test('typo duplicate is permanently consolidated into the canonical article',()=>{
  assert.equal(fs.existsSync('blog/onprijsd-probleem-bedrijfsvoering/index.html'),false);
  const sitemap=fs.readFileSync('sitemap.xml','utf8');
  const index=fs.readFileSync('blog/index.html','utf8');
  const rss=fs.readFileSync('blog/rss.xml','utf8');
  const redirects=fs.readFileSync('_redirects','utf8');

  assert.equal(sitemap.includes(duplicate),false);
  assert.equal(index.includes(duplicate),false);
  assert.equal(rss.includes(duplicate),false);
  assert.ok(sitemap.includes(canonical));
  assert.ok(index.includes(canonical));
  assert.ok(rss.includes(canonical));
  assert.ok(redirects.includes('/blog/onprijsd-probleem-bedrijfsvoering/  /blog/ongeprijsd-probleem-bedrijfsvoering/  301!'));
});
