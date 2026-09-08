import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagePath = new URL('../portal-v2/linkedin-revenue.html', import.meta.url);
const dataPath = new URL('../portal-v2/linkedin-revenue-data.json', import.meta.url);

test('LinkedIn revenue cockpit production page exists', () => {
  assert.equal(fs.existsSync(pagePath), true, 'portal-v2/linkedin-revenue.html must exist');
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

test('cockpit snapshot is explicit, bounded and contains only real profile URLs', () => {
  assert.equal(fs.existsSync(dataPath), true, 'cockpit data snapshot missing');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  assert.equal(data.schemaVersion, 'linkedin-revenue-cockpit-v1');
  assert.ok(data.generatedAt);
  assert.ok(Array.isArray(data.actions));
  assert.ok(data.actions.length <= 12, 'today queue must never exceed 12 actions');
  for (const action of data.actions) {
    assert.ok(action.person, 'every action needs a person');
    assert.match(action.linkedinUrl, /^https:\/\/www\.linkedin\.com\/in\//, `invalid profile URL for ${action.person}`);
    if (action.readyText) {
      assert.ok(action.contextEvidence && action.contextEvidence !== 'generic-feed', `ready text without evidence for ${action.person}`);
    }
  }
});
