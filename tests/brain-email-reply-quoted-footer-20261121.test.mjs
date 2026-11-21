import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractVisibleEmailReply,isExplicitUnsubscribeReply}
  from '../supabase/functions/_shared/email-reply-visible-text.mjs';

const outbound='Wil je geen berichten meer van mij? Antwoord met "afmelden".';
const oldOutbound='Wil je geen mail meer van mij? Antwoord met "afmelden" en ik mail je niet meer.';
const replySource=readFileSync('supabase/functions/powerhouse-email-reply-loop/index.ts','utf8');

test('positive recipient reply survives quoted branded Gmail opt-out footer',()=>{
  const input=[
    'Hoi Arthur,','','Dat klinkt interessant. Stuur me het voorbeeld maar.','',
    'Op za 21 nov 2026 08:00 schreef Arthur Prinsen <arthur@bedrijfsgeheugen.nl>:',
    '> Ik ben Bedrijfsgeheugen begonnen om kennis te verbinden.',
    '> '+outbound
  ].join('\n');
  assert.equal(extractVisibleEmailReply(input),'Hoi Arthur,\n\nDat klinkt interessant. Stuur me het voorbeeld maar.');
  assert.equal(isExplicitUnsubscribeReply(input),false);
});
test('old and new original unsubscribe templates never become consent revocation from quoted original',()=>{
  const old=['Interessant voor onze afdeling.','',
    'On Sat, Nov 21, 2026 at 08:00 AM Arthur Prinsen wrote:',oldOutbound].join('\n');
  assert.equal(extractVisibleEmailReply(old),'Interessant voor onze afdeling.');
  assert.equal(isExplicitUnsubscribeReply(old),false);
  const noHeader=['Dank voor je reactie, daar praten we verder over.','',outbound].join('\n');
  assert.equal(extractVisibleEmailReply(noHeader),'Dank voor je reactie, daar praten we verder over.');
  assert.equal(isExplicitUnsubscribeReply(noHeader),false);
});
test('a quote-only Gmail reply is not counted as response or optout',()=>{
  const input=['On Sat, Nov 21, 2026 at 08:00 AM Arthur Prinsen wrote:',
    '> Hallo','> '+outbound].join('\n');
  assert.equal(extractVisibleEmailReply(input),'');
  assert.equal(isExplicitUnsubscribeReply(input),false);
});
test('unrelated mention or a negated unsubscribe is not a stop instruction',()=>{
  for(const input of [
    'Ik wil me niet afmelden. Stuur die casus maar!',
    'Je noemde het woord afmelden in je vorige mail. Wat bedoelde je?',
    'Waar staat de tekst "afmelden" precies? Ik wil de analyse wel lezen.',
    'Ik zag in het originele bericht "'+outbound+'" maar ontvang graag meer informatie.'
  ]) assert.equal(isExplicitUnsubscribeReply(input),false,input);
});
test('genuine direct optouts still suppress after visible-text extraction',()=>{
  for(const input of [
    'Afmelden',
    'Uitschrijven.',
    'Ik wil me afmelden.',
    'Kun je mij afmelden?',
    'Mail me niet meer.',
    'Verwijder mij uit de lijst.',
    'Please unsubscribe.'
  ])assert.equal(isExplicitUnsubscribeReply(input),true,input);
  const direct=['Afmelden','',
    'On Sat, Nov 21, 2026 at 08:00 AM Arthur wrote:',
    '> '+outbound].join('\n');
  assert.equal(extractVisibleEmailReply(direct),'Afmelden');
  assert.equal(isExplicitUnsubscribeReply(direct),true);
});
test('canonical reply ingestion strips quotation BEFORE classifier, permanent suppression and business outcome',()=>{
  assert.match(replySource,/import \{extractVisibleEmailReply,isExplicitUnsubscribeReply\} from/);
  assert.match(replySource,/const text=extractVisibleEmailReply\(msg\?\.messageText\|\|msg\?\.preview\?\.body\);/);
  const extract=replySource.indexOf('const text=extractVisibleEmailReply(');
  const classify=replySource.indexOf('const c=classify(text)');
  const insert=replySource.indexOf("db.from('powerhouse_email_reply_events').insert");
  const suppress=replySource.indexOf("db.from('powerhouse_email_contact_suppressions').upsert");
  assert.ok(extract>0&&classify>extract&&insert>classify&&suppress>insert);
  assert.match(replySource,/if\(!text\)\{quotedOnlySkipped\+\+;continue;\}/);
  assert.match(replySource,/if\(isExplicitUnsubscribeReply\(textRaw\)\)/);
  assert.match(replySource,/quoted_only_skipped:quotedOnlySkipped/);
  assert.match(replySource,/source_message_id:messageId/);
  assert.match(replySource,/onConflict:'dedupe_key'/);
  assert.doesNotMatch(replySource,/\[' uitschrijven',' afmelden'/);
});


test('HTML-format Gmail reply excludes complete gmail_quote subtree and preserves HTML direct optout',()=>{
  const reply='<div dir="ltr">Interessant. Stuur de PDF maar.</div>'+
    '<div class="gmail_quote"><div>On Sat Arthur wrote:</div>'+
    '<p>Wil je geen berichten meer van mij? Antwoord met &quot;afmelden&quot;.</p></div>';
  assert.equal(extractVisibleEmailReply(reply),'Interessant. Stuur de PDF maar.');
  assert.equal(isExplicitUnsubscribeReply(reply),false);
  assert.equal(extractVisibleEmailReply('<p>Afmelden</p>'),'Afmelden');
  assert.equal(isExplicitUnsubscribeReply('<p>Afmelden</p>'),true);
  assert.equal(extractVisibleEmailReply('<p>Interessant</p><script>alert(1)</script>'),'');
  assert.equal(extractVisibleEmailReply('<div>Afmelden</div><script'),'');
  assert.equal(isExplicitUnsubscribeReply('<div>Afmelden</div><script'),false);
  assert.equal(extractVisibleEmailReply('<div>Afmelden</div><img src=x onerror=alert(1)>'),'');
});
