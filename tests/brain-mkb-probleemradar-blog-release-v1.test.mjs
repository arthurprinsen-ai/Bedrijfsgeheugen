import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const articles = [
  ['blog/groeipijn-mkb-eigenaar-bottleneck/index.html','groeipijn in het mkb'],
  ['blog/cashflow-overzicht-mkb/index.html','cashflow-overzicht voor het mkb'],
  ['blog/dubbele-invoer-voorkomen-systemen-koppelen/index.html','dubbele invoer voorkomen'],
];

test('MKB Probleemradar blogs blijven release-eligible en traceerbaar', () => {
  const sitemap = fs.readFileSync('sitemap.xml','utf8');
  const index = fs.readFileSync('blog/index.html','utf8');
  const rss = fs.readFileSync('blog/rss.xml','utf8');
  for (const [path, keyword] of articles) {
    assert.equal(fs.existsSync(path), true, path);
    const html = fs.readFileSync(path,'utf8');
    const slug = path.split('/')[1];
    const canonical = 'https://www.bedrijfsgeheugen.nl/blog/' + slug + '/';
    assert.ok(html.toLowerCase().includes('name="bg-zoekwoord" content="' + keyword.toLowerCase() + '"'));
    assert.match(html, /"@type":"FAQPage"/);
    assert.ok((html.match(/<figure\b/gi)||[]).length >= 2);
    assert.ok((html.match(/<figcaption\b/gi)||[]).length >= 2);
    assert.ok(html.includes(canonical));
    assert.equal(sitemap.split(canonical).length - 1, 1);
    assert.ok(index.includes('/blog/' + slug + '/'));
    assert.ok(rss.includes(canonical));
  }
});
