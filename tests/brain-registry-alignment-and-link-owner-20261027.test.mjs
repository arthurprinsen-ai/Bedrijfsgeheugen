import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const fn = fs.readFileSync('supabase/functions/powerhouse-composio-linkedin-setup/index.ts', 'utf8');
const migA = fs.readFileSync('supabase/migrations/20261027170326_news_approved_contacts_first_v1.sql', 'utf8');
const migB = fs.readFileSync('supabase/migrations/20261027180000_news_approved_contacts_first_v1.sql', 'utf8');

test('company link always targets the canonical owner, never a prior test user', () => {
  assert.match(fn, /const linkUserId=proofUserId\|\|USER_ID;/);
  assert.doesNotMatch(fn, /priorState\?\.user_id\)\|\|USER_ID/);
});

test('registry-alignment migration is idempotent and matches the live definition', () => {
  assert.match(migA, /create or replace function public\.bg_bedrijven_voor_nieuws/);
  assert.match(migA, /revoke all on function public\.bg_bedrijven_voor_nieuws/);
  const body=(s)=>s.split('\n').filter(l=>!l.startsWith('--')).join('\n').trim(); assert.equal(body(migA), body(migB));
});
