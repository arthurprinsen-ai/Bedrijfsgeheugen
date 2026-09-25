import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const article=fs.readFileSync('blog/versiebeheer-mkb-juiste-versie/index.html','utf8');
const index=fs.readFileSync('blog/index.html','utf8');
const rss=fs.readFileSync('blog/rss.xml','utf8');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const canonical='https://www.bedrijfsgeheugen.nl/blog/versiebeheer-mkb-juiste-versie/';

test('recovered version-management blog uses canonical self-scan link and all publication registries',()=>{
  assert.match(article,/versiebeheer mkb/i);
  assert.ok(!article.includes('href="/scan"'));
  assert.ok(article.includes('href="/zelfscan"'));
  assert.ok(index.includes('/blog/versiebeheer-mkb-juiste-versie/'));
  assert.ok(rss.includes(canonical));
  assert.equal(sitemap.split(canonical).length-1,1);
});
