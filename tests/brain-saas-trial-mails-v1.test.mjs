import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { composeTrialMail, pickVariant, segmentOf, sampleContexts, MAIL_KEYS, OPT_OUT_LINE } from '../supabase/functions/_shared/trial-lifecycle-mail.mjs';

const fn = await readFile('supabase/functions/bg-trial-lifecycle-mail/index.ts', 'utf8');
const mig = await readFile('supabase/migrations/20261027200000_saas_trial_mails_v1.sql', 'utf8');

test('elke mail, variant en soort account levert een volledige tekst zonder lege velden', () => {
  for (const mk of MAIL_KEYS) for (const v of ['A', 'B']) for (const ctx of sampleContexts()) {
    const m = composeTrialMail(mk, v, ctx);
    assert.ok(m.subject.length > 5 && m.body.length > 80);
    assert.doesNotMatch(m.subject + m.body, /undefined|null|NaN|\{\w+\}/);
    assert.ok(m.body.includes(OPT_OUT_LINE), 'afmeldregel ontbreekt');
    assert.ok(m.body.includes('/afsluiten?plan=pro'));
    assert.match(m.body, /Arthur/);
  }
});

test('tekst volgt wat het account deed', () => {
  const [actief, leeg] = sampleContexts();
  assert.equal(segmentOf(actief), 'actief');
  assert.equal(segmentOf(leeg), 'niet_gestart');
  assert.match(composeTrialMail('d23', 'A', actief).body, /2 scans \(laatste score 54\), 1 koppeling en 12 AI-vragen/);
  assert.match(composeTrialMail('d23', 'A', leeg).body, /nog niets in/);
});

test('dag 29 noemt prijs exclusief btw en belooft geen afschrijving', () => {
  const m = composeTrialMail('d29', 'A', sampleContexts()[0]);
  assert.match(m.body, /€ 299 per maand, excl\. btw/);
  assert.match(m.body, /niets afgeschreven/);
});

test('variant is stabiel per proef en beide varianten komen voor', () => {
  const ids = Array.from({ length: 16 }, (_, i) => '00000000-0000-0000-0000-00000000000' + i.toString(16));
  const set = new Set(ids.map(pickVariant));
  assert.deepEqual([...set].sort(), ['A', 'B']);
  assert.equal(pickVariant(ids[3]), pickVariant(ids[3]));
});

test('verzender: blokkadelijst, claim vóór verzenden, geen automatische herhaling bij twijfel', () => {
  assert.match(fn, /powerhouse_email_contact_suppressions/);
  assert.match(fn, /status: 'claimed'/);
  assert.match(fn, /SEND_ACK_MESSAGE_ID_MISSING/);
  assert.match(fn, /MAX_PER_RUN = 25/);
  assert.match(fn, /x-powerhouse-token/);
});

test('migratie: unieke mail per proef, browserrollen ingetrokken, test-adressen uitgesloten', () => {
  assert.match(mig, /unique \(subscription_id, mail_key\)/);
  assert.match(mig, /revoke all on table public\.saas_trial_mails from public, anon, authenticated/);
  assert.match(mig, /revoke all on table public\.saas_trial_mail_learning_v1 from public, anon, authenticated/);
  assert.match(mig, /revoke all on function public\.saas_trial_mail_due_v1/);
  assert.match(mig, /not ilike '%@bedrijfsgeheugen\.nl'/);
  assert.match(mig, /with \(security_invoker = true\)/);
});

import { optOutRequested } from '../supabase/functions/_shared/trial-lifecycle-mail.mjs';

test('afmelden via antwoord: herkend, maar niet via geciteerde tekst of de eigen afmeldregel', () => {
  assert.equal(optOutRequested('Graag afmelden, bedankt.'), true);
  assert.equal(optOutRequested('Wil je me niet meer mailen? Graag uitschrijven.'), true);
  assert.equal(optOutRequested('> Geen mail meer van mij? Antwoord met "afmelden"'), false);
  assert.equal(optOutRequested('Ja, interesse, bel me volgende week'), false);
  assert.equal(optOutRequested('> afmelden\nNee bedankt, wel interesse'), false);
  assert.match(fn, /checkOptOuts\(db, key, acct\)/);
  assert.match(fn, /trial_mail_opt_out/);
});
