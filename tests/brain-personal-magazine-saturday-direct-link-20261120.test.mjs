import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {personalFirstPersonCopyViolations,isVerifiedPersonalMagazineGift,magazineGiftLinkIsExact} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';
import {personalEditorialViolations} from '../supabase/functions/_shared/personal-linkedin-editorial-contract.mjs';

const date='2026-11-21';
const link='https://www.bedrijfsgeheugen.nl/de-kloof';
const evidence={
 content_id:'user-authored-founder:2026-11-21:de-kloof-q4-free-first-magazine',
 ai_native_builder_story_verified:true,
 ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',
 build_event_kind:'user_verified_owned_editorial_magazine_public_release',
 build_event_verified:true,arthur_anchor_verified:true,
 source_backed:true,personal_truth_verified:true,first_person_claims_verified:true,
 business_topic:true,corporate_voice:false,company_page_interchangeable:false,
 forced_business_moral:false,
 identity_contract:'arthur-personal-linkedin-identity-v4',
 identity_gate_version:'channel-identity-hard-gate-v3',
 magazine_landing_url:link,requested_scheduled_for:'2026-11-21T09:00:00+01:00',
 source_text:'Op 20 november 2026 bevestigde de gebruiker uitdrukkelijk dat hij het eigen magazine al heeft, gratis wil weggeven en een warme zaterdaggroet vroeg voor 21 november 2026. De echte cover en de gratis PDF staan op de eigen website.',
 source_lineage:['current-chat:user-fact:2026-11-20:saturday-morning-personal-post-free'],
 sensitive_private_detail:false
};
const allowed=[
 'Goedemorgen en een fijne zaterdag! ☕',
 '',
 'Ik ben met iets nieuws begonnen: De Kloof. Een kwartaalmagazine dat ik graag gratis deel met ondernemers.',
 '',
 'Over AI verschijnen elke dag nieuwe tools en grote beloftes. Maar voor een ondernemer zijn de belangrijkere vragen vaak: waar begin ik, welke beslissing neem ik en hoe weet ik straks of het werkt?',
 '',
 'Voor deze editie heb ik Europese en Nederlandse cijfers naast elkaar gelegd. Je vindt er een analyse van 27 EU-landen, negen praktische bouwblokken en een kwartaalritueel van 90 minuten, inclusief invulbare werkbladen.',
 '',
 'Mijn uitnodiging voor deze zaterdag: neem een kop koffie, kies één vraagstuk uit je bedrijf en maak er rustig tijd voor. Niet nóg een tool verzamelen, maar één stap kiezen die echt zinvol is.',
 '',
 'De Kloof, No. 04 — gratis lezen en downloaden:',
 link,
 '',
 'Fijne zaterdag!'
].join('\n');

const codes=(t,e=evidence)=>personalEditorialViolations(t,e).map(x=>x.code);

test('the original user-authorized Saturday free magazine has exactly one approved direct link and coffee greeting',()=>{
 assert.ok(isVerifiedPersonalMagazineGift(evidence));
 assert.ok(magazineGiftLinkIsExact(allowed,evidence));
 assert.deepEqual(personalFirstPersonCopyViolations(allowed,evidence,date),[]);
 assert.deepEqual(codes(allowed),[]);
});
test('the original safeguards reject changed domain, additional URL, second emoji, fake user/source or generic commercial story',()=>{
 const wrongUrl=allowed.replace(link,'https://other.example/de-kloof');
 assert.ok(personalFirstPersonCopyViolations(wrongUrl,evidence,date).includes('PERSONAL_PROMOTIONAL_URL_NOT_ALLOWED'));
 assert.ok(codes(wrongUrl).includes('PERSONAL_EDITORIAL_URL'));
 assert.ok(codes(allowed+'\nhttps://www.bedrijfsgeheugen.nl/andere-pagina').includes('PERSONAL_EDITORIAL_URL'));
 assert.ok(codes(allowed.replace('Fijne zaterdag!','Fijne zaterdag! 🚀')).includes('PERSONAL_EDITORIAL_EMOJI'));
 assert.ok(codes(allowed.replace('Goedemorgen en een fijne zaterdag! ☕','Goedemorgen! ☕')).includes('PERSONAL_EDITORIAL_EMOJI'));
 assert.ok(personalFirstPersonCopyViolations(allowed,{...evidence,magazine_landing_url:'https://other.example/de-kloof'},date).includes('PERSONAL_PROMOTIONAL_URL_NOT_ALLOWED'));
 assert.ok(personalFirstPersonCopyViolations(allowed,{...evidence,source_lineage:['unverified-generator:text']},date).includes('PERSONAL_PROMOTIONAL_URL_NOT_ALLOWED'));
 assert.ok(codes(allowed,{...evidence,content_id:'some-other-author'}).includes('PERSONAL_EDITORIAL_URL'));
 const fake=allowed.replace('De Kloof, No. 04 — gratis lezen en downloaden:', 'Reageer met KLOOF voor de download:');
 assert.ok(codes(fake).includes('PERSONAL_EDITORIAL_ENGAGEMENT_BAIT'));
});
test('existing owner and independent review invoke SAME amended shared validators, no alternate publisher',()=>{
 const writer=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
 const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 const reviewer=readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');
 const gate=readFileSync('supabase/functions/_shared/personal-first-person-story-gate.mjs','utf8');
 const editorial=readFileSync('supabase/functions/_shared/personal-linkedin-editorial-contract.mjs','utf8');
 assert.match(writer,/ÉÉNMALIGE EIGEN MAGAZINE-LANCERING/);
 assert.match(writer,/personalEditorialViolations/);
 assert.match(publisher,/personalLastMilePublicationViolations/);
 assert.match(publisher,/personalEditorialViolations/);
 assert.match(publisher,/PERSONAL_MAGAZINE_GIFT_DIRECT_LINK_REQUIRED/);
 assert.match(publisher,/magazineGiftLinkIsExact/);
 assert.match(reviewer,/personalFirstPersonCopyViolations/);
 assert.match(reviewer,/PERSONAL_MAGAZINE_GIFT_DIRECT_LINK_REQUIRED/);
 assert.match(reviewer,/magazineGiftLinkIsExact/);
 assert.match(reviewer,/personalEditorialViolations/);
 assert.ok(gate.includes('magazineGiftLinkIsExact'));
 assert.ok(editorial.includes('magazineGiftLinkIsExact'));
});
