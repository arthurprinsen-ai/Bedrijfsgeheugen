import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assessOfficialBlogDateTruth} from '../supabase/functions/_shared/blog-official-date-truth.mjs';

const runDate='2026-11-01';
const source='https://www.rvo.nl/subsidies-financiering/cpnl';
const futureDraft={
 title:'Zo maak je je plastic-recyclingproject subsidie-klaar vóór de Circular Plastics NL-aanvraag',
 body:'Volgens een recente forecast is er een belangrijke kans op komst: de Circular Plastics NL-subsidie wordt voorspeld open te gaan rond 6 oktober 2026 met een budget van ongeveer €40 miljoen.',
 cta:'Blok 4 weken voor de readiness-sprint en wees 6 weken voor de verwachte opening gereed.',
 runDate
};
test('actual unsent 1 Nov future CPNL 6 Oct draft is rejected before publication',()=>{
 const v=assessOfficialBlogDateTruth(futureDraft);
 assert.equal(v.ok,false);
 assert.equal(v.code,'BLOG_OFFICIAL_SUBSIDY_DEADLINE_INVERTED');
 assert.equal(v.source,source);
 assert.equal(v.actual_closed_on,'2026-10-06');
 assert.equal(v.published_approval_allowed,false);
});
test('real 13:12 regenerated blog: date BEFORE opengaat is still false',()=>{
 const v=assessOfficialBlogDateTruth({
  title:'Hoe u uw recyclingproject klaarstoomt voor de Circular Plastics NL-subsidie: een praktische roadmap voor ondernemers',
  body:'Onze forecast verwacht dat de Circular Plastics NL-subsidie op 6 oktober 2026 opengaat met een budget van €40 miljoen. Dat maakt dit een concreet moment om te beslissen of u wilt meedoen.',
  cta:'Ga nu direct aan de slag met een aanvraag.',
  runDate:'2026-11-01'
 });
 assert.equal(v.ok,false);
 assert.equal(v.code,'BLOG_OFFICIAL_SUBSIDY_DEADLINE_INVERTED');
});
test('real original Postgres run_date is a Date object and still applies the factual gate',()=>{
 const v=assessOfficialBlogDateTruth({
  ...futureDraft, title:'MKB en Circular Plastics NL',
  body:'Onze forecast verwacht dat de Circular Plastics NL-subsidie op 6 oktober 2026 opengaat.',
  runDate:new Date('2026-11-01T00:00:00Z')
 });
 assert.equal(v.code,'BLOG_OFFICIAL_SUBSIDY_DEADLINE_INVERTED');
});
test('truthful closed-date sentence does not exempt a separate false future-opening sentence',()=>{
 const v=assessOfficialBlogDateTruth({
  title:'Lessen uit de Circular Plastics NL ronde',
  body:'Circular Plastics NL 2026 sloot op 6 oktober 2026. Onze forecast verwacht dat Circular Plastics NL op 6 oktober 2026 opengaat.',
  cta:'Volg RVO voor nieuwe officiële openstellingen.',runDate:'2026-11-01'
 });
 assert.equal(v.ok,false);
});
test('historical CPNL opening and closing in a single sentence remain allowed',()=>{
 const v=assessOfficialBlogDateTruth({
  title:'Terugblik Circular Plastics NL 2026',
  body:'Circular Plastics NL opende in april 2026 en sloot op 6 oktober 2026. De aanvraagperiode is voorbij.',
  cta:'Controleer de officiële RVO-status.',runDate:'2026-11-01'
 });
 assert.equal(v.ok,true);
});
test('future 6 Oct forecast is rejected even with neutral title',()=>{
 const v=assessOfficialBlogDateTruth({...futureDraft,title:'MKB en circular plastics in Nederland'});
 assert.equal(v.ok,false);
});
test('outdated before-application title cannot hide truthful historical body',()=>{
 const v=assessOfficialBlogDateTruth({...futureDraft,body:'Circular Plastics NL 2026 opende op 21 april en sloot op 6 oktober 2026.'});
 assert.equal(v.ok,false);
});
test('legitimate retrospective source copy passes; same old date is not sufficient',()=>{
 const v=assessOfficialBlogDateTruth({
  title:'Wat mkb-bedrijven kunnen leren van de gesloten CPNL-ronde 2026',
  body:'Circular Plastics NL 2026 opende op 21 april 2026. Aanvragen sloten op 6 oktober 2026. Controleer altijd de actuele RVO-pagina.',
  cta:'Plan voorbereiding voor een volgende officieel aangekondigde ronde zonder nieuwe datum te verzinnen.',
  runDate
 });
 assert.equal(v.ok,true);
});
test('unrelated genuinely current SOPV 2026 applications are not false-blocked',()=>{
 const v=assessOfficialBlogDateTruth({
  title:'Subsidie Omschakeling Plasticverwerkers 2026',
  body:'De Subsidie Omschakeling Plasticverwerkers 2026 liep volgens RVO van 6 oktober 2026 tot 15 december 2026.',
  cta:'Controleer de actuele subsidievoorwaarden bij RVO.',
  runDate
 });
 assert.equal(v.ok,true);
});
test('time-gated future forecast does not retroactively block pre-closure day',()=>{
 const v=assessOfficialBlogDateTruth({...futureDraft,runDate:'2026-10-01'});
 assert.equal(v.ok,true);
});
test('the existing original blog producer feeds this validation into original reader-repair before artifact write',async()=>{
 const s=await readFile(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 const queue=await readFile(new URL('../supabase/functions/powerhouse-blog-queue/index.ts',import.meta.url),'utf8');
 const exportGate=await readFile(new URL('../supabase/functions/powerhouse-blog-export/index.ts',import.meta.url),'utf8');
 assert.match(s,/assessOfficialBlogDateTruth/);
 assert.match(s,/typeof artifact\\?\\.run_date\\?\\.toISOString==='function'/);
 assert.match(s,/blogReaderReadyViolations\(\{\.\.\.artifact,body:bodyText,run_date:runDate\}\)/);
 assert.match(s,/reopenRejectedBlog\(db,runDate,blogReaderReadyViolations,blogQualityReview\)/);
 assert.match(s,/persistRepairedBlog\(db,runDate,blogRepairClaim,artifactPayload,decisionPayload\)/);
 assert.match(s,/BLOG_READER_READY_CONTRACT_FAILED/);
 assert.match(queue,/assessOfficialBlogDateTruth/);
 assert.match(exportGate,/assessOfficialBlogDateTruth/);
});
