import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('prijzen.html','utf8');
const seoControle=fs.readFileSync('.github/scripts/seocontrole.py','utf8');

test('prijzen primary Frisse Blik CTA is canonical and measurable in retained main content',()=>{
  assert.match(
    html,
    /<a\b[^>]*class=["'][^"']*\bknop\b[^"']*["'][^>]*href=["']https:\/\/www\.bedrijfsgeheugen\.nl\/frisse-blik["'][^>]*data-bg-conversion=["']frisse-blik["'][^>]*data-bg-page-role=["']money["'][^>]*data-bg-funnel-stage=["']decide["'][^>]*>Start gratis<\/a>/i
  );
});

test('SEO scanner includes the canonical blog index as well as article indexes',()=>{
  assert.match(seoControle,/\['blog\/index\.html'\]/);
  assert.match(seoControle,/glob\.glob\('blog\/\*\/index\.html'\)/);
});
