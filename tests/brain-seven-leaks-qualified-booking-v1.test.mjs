import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const landing=readFileSync(new URL('../pages/7-bedrijfslekken.html',import.meta.url),'utf8');
const oldScan=readFileSync(new URL('../zelfscan.html',import.meta.url),'utf8');
const pdf=readFileSync(new URL('../assets/downloads/7-verborgen-bedrijfslekken.pdf',import.meta.url),'latin1');
const locale=JSON.parse(readFileSync(new URL('../config/bg-static-i18n-en.d/2026-10-09-seven-leaks-qualified-booking.json',import.meta.url),'utf8'));

test('historical replay: existing ungated workbook and free scan remain primary',()=>{
  assert.match(landing,/href="\/assets\/downloads\/7-verborgen-bedrijfslekken\.pdf"/);
  assert.match(landing,/href="\/zelfscan\?utm_source=werkboek/);
  assert.match(pdf,/^%PDF-1\.4/);
  assert.doesNotMatch(landing,/<form\b/i);
});

test('shadow: optional booking opens the verified active Calendly event not a scan gate',()=>{
  const match=landing.match(/<a[^>]*data-bg-cta-intent="meeting_booking_page"[^>]*>[^<]*<\/a>/);
  assert.ok(match,'Missing optional booking URL');
  assert.match(match[0],/href="https:\/\/calendly\.com\/arthur-prinsen\/adviesgesprek-slimmer-geregeld"/);
  assert.match(match[0],/target="_blank" rel="noopener noreferrer"/);
  assert.match(match[0],/Plan gratis een gesprek \(30 minuten\)/);
  assert.equal((landing.match(/data-bg-cta-intent="meeting_booking_page"/g)||[]).length,1);
});

test('canary: click is only booking intent and never booked appointment or paid revenue',()=>{
  assert.doesNotMatch(landing,/data-bg-conversion="adviesgesprek"/);
  assert.doesNotMatch(landing,/data-bg-funnel-stage="qualified_call"/);
  assert.match(landing,/<script src="\/assets\/meting\.js" defer><\/script>/);
  assert.match(oldScan,/href="https:\/\/calendly\.com\/arthur-prinsen\/adviesgesprek-slimmer-geregeld"/);
});

test('localization: explicit call CTA copy is faithfully translated',()=>{
  assert.equal(locale['Plan gratis een gesprek (30 minuten) →'],'Book a free call (30 minutes) →');
  assert.equal(Object.keys(locale).length,1);
});
