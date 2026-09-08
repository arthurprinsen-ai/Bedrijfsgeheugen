import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagePath = new URL('../intern/linkedin-revenue/index.html', import.meta.url);
const scriptPath = new URL('../intern/linkedin-revenue/cockpit.js', import.meta.url);
const functionPath = new URL('../netlify/functions/linkedin-revenue-cockpit.mjs', import.meta.url);

test('protected LinkedIn revenue cockpit production page exists', () => {
  assert.equal(fs.existsSync(pagePath), true, 'intern/linkedin-revenue/index.html must exist');
});

test('cockpit exposes the complete revenue workflow and a hard 12-action cap', () => {
  assert.equal(fs.existsSync(pagePath), true, 'cockpit page missing');
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /data-cockpit="linkedin-revenue"/);
  assert.match(html, /data-max-actions="12"/);
  for (const label of ['Vandaag', 'Inbox & DM', 'Connecties', 'Posts', 'Follow-up', 'Revenue']) {
    assert.ok(html.includes(label), `missing cockpit lane: ${label}`);
  }
});

test('cockpit refuses generic feed URLs and ungrounded sales copy', () => {
  assert.equal(fs.existsSync(pagePath), true, 'cockpit page missing');
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.ok(!html.includes('href="https://www.linkedin.com/feed/"'), 'generic LinkedIn feed may not be an action source');
  assert.match(html, /Geen tekst zonder bewijs/);
  assert.match(html, /Context aanvullen/);
});

test('cockpit loads runtime data instead of committing a private CRM snapshot', () => {
  assert.equal(fs.existsSync(scriptPath), true, 'cockpit client missing');
  assert.equal(fs.existsSync(functionPath), true, 'protected runtime function missing');
  const client = fs.readFileSync(scriptPath, 'utf8');
  assert.match(client, /\/intern\/api\/linkedin-revenue/);
  assert.ok(!fs.existsSync(new URL('../intern/linkedin-revenue/data.json', import.meta.url)), 'private CRM snapshot must not be committed');
});
