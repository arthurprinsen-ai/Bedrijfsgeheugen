import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync('prijzen.html','utf8');
test('prijzen primary Frisse Blik CTA is canonical and measurable',()=>{
  assert.match(html,/<a\b[^>]*href=["']https:\/\/www\.bedrijfsgeheugen\.nl\/frisse-blik["'][^>]*data-bg-conversion=["']frisse-blik["'][^>]*data-bg-page-role=["']money["'][^>]*data-bg-funnel-stage=["']decide["'][^>]*>/i);
});