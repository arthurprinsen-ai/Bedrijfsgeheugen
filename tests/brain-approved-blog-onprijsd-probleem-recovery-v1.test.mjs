import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const article=fs.readFileSync('blog/onprijsd-probleem-bedrijfsvoering/index.html','utf8');
const index=fs.readFileSync('blog/index.html','utf8');
const rss=fs.readFileSync('blog/rss.xml','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const canonical='https://www.bedrijfsgeheugen.nl/blog/onprijsd-probleem-bedrijfsvoering/';

test('approved onprijsd-probleem blog is fully registered on current site surfaces',()=>{
  assert.match(article,/onprijsd probleem bedrijfsvoering/i);
  assert.match(article,/meta name="description" content="[^"]{140,160}"/i);
  assert.ok(index.includes('/blog/onprijsd-probleem-bedrijfsvoering/'));
  assert.ok(rss.includes(canonical));
  assert.equal(sitemap.split(canonical).length-1,1);
});
