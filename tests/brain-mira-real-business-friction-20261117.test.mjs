import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyMiraBusinessFriction,MIRA_BUSINESS_FRICTION_CONTRACT}
 from '../supabase/functions/powerhouse-mira-problem-radar/business-friction-signals.mjs';

const score=(title,excerpt='')=>classifyMiraBusinessFriction({title,excerpt});

test('real recent MKB harm is business friction even without literal complaint language',()=>{
 for(const title of [
  "Personeelstekort en gebrek aan vaardigheden belemmeren innovatie bij een derde van mkb",
  "Te laat betaalde facturen knijpen de cashflow van Dordtse mkb'ers af",
  "Offerte blijft liggen en klant moet opnieuw bellen",
  "Fouten in Excel zorgen voor verschillende cijfers",
  "Dubbele invoer vertraagt de financiële administratie",
  "Project loopt vast door meerwerkkosten",
  "Klantverlies en omzetverlies zetten de marge onder druk"
 ]){
  assert.equal(score(title).frictionScore,1,title);
 }
 assert.equal(score('Normaal productnieuws zonder aantoonbare bedrijfsfrictie').frictionScore,0.55);
 assert.equal(score('Mkb voelt personeelstekort').contract,MIRA_BUSINESS_FRICTION_CONTRACT);
});
test('vendor/software announcements are not promoted into claims of experienced customer harm',()=>{
 const vendor=[
  ['Teamleader lanceert AI-assistent die offertes en betalingsherinneringen kan voorbereiden',
   'Deze tool pakt betalingsachterstand en personeelstekort aan voor ondernemers'],
  ['Teamleader lanceert Focus AI voor mkb','Helpt bij klantverlies en achterstallige facturen'],
  ['Softwareleverancier introduceert nieuwe tool voor personeelsplanning','Voorkomt planningstekort'],
  ['SaaS-startup brengt platform op de markt','Problemen met debiteuren worden opgelost']
 ];
 for(const [title,excerpt] of vendor){
  const result=score(title,excerpt);
  assert.equal(result.frictionScore,0.55,title);
  assert.equal(result.admissible,false,'release must never be an observed MKB harm source');
  assert.equal(result.reason,'VENDOR_ANNOUNCEMENT_NOT_OBSERVED_OPERATIONAL_FRICTION');
 }
});
test('the business launch veto is a real score-independent eligibility gate in the source writer',()=>{
 const source=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');
 assert.match(source,/businessEvidence\?\.admissible!==false/);
 assert.match(source,/business_source_admissible:businessEvidence\?\.admissible\?\?null/);
 assert.match(source,/business_source_admission_reason:businessEvidence\?\.reason\|\|null/);
 assert.match(source,/VENDOR_ANNOUNCEMENT_NOT_OBSERVED_OPERATIONAL_FRICTION/);
 assert.match(source,/channel==='linkedin_personal'&&!personalTopic/);
 assert.match(source,/PERSONAL_SOURCE_NOT_OBSERVATIONAL_CONTEXT/);
 // No single source from two LinkedIn personal search slots may become Mira.
 assert.ok(source.indexOf("if(channel==='linkedin_personal'&&!personalTopic)")<
  source.indexOf('const problemTopic=personalTopic||topic(title'));
 // The original real-source hard floor is still in force.
 assert.match(source,/eligible:total>=0\.72&&publication\.eligible/);
});

test('original one-radar source/date/score/URL gates and personal lane remain unchanged',()=>{
 const code=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');
 const materializer=readFileSync(new URL('../supabase/migrations/20261027190000_mira_entrepreneur_signal_materializer_v1.sql',import.meta.url),'utf8');
 assert.match(code,/classifyMiraBusinessFriction/);
 assert.match(code,/channel==='instagram_company'/);
 assert.match(code,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(code,/classifyMiraSourceUrl\(sourceUrl\)\.ok/);
 assert.match(code,/MAX_AGE_DAYS=45/);
 assert.match(code,/rotateDistinctMiraQueries\(runDate,selectCanonicalRadarSourceQueries\(runDate\)\)/);
 assert.match(materializer,/p_date-90/);
 assert.match(materializer,/p_date-3/);
 const helper=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/business-friction-signals.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(helper,/fetch\(|cron\.schedule|MEDIA_PUBLISH|GMAIL_SEND_EMAIL|supabase\.rpc/);
});


test('genuine 16 Nov 2026 Dutch invoice-processing harm is detectable without inventing a customer case',()=>{
 for(const [headline,excerpt] of [
  ['Bedrijven zetten klanten onder druk door eigen factuurfouten','Onjuiste factuur leidt tot betalingsachterstand.'],
  ['Onjuiste facturen veroorzaken foutieve betaalverzoeken','De administratie moet worden gecorrigeerd.'],
  ['Krappe marges en onzekerheid remmen investeringen bij mkb-maakbedrijven','Personeelstekort belemmert de planning.']
 ]){
  const x=score(headline,excerpt);
  assert.equal(x.admissible,true,headline);
  assert.equal(x.frictionScore,1,headline);
 }
 for(const headline of [
  'Leverancier lanceert nieuw factuurfouten-preventieplatform',
  'Softwarebedrijf introduceert AI-oplossing voor krappe marges'
 ]){
  assert.equal(score(headline,'Innovatie voor ondernemers').admissible,false,headline);
 }
 const src=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');
 assert.match(src,/factuurfout\|foutieve factu\(\?:u\)\?r\|onjuiste factu\(\?:u\)\?r/);
 assert.match(src,/krappe marges\|marges\? onder druk/);
 assert.match(src,/eligible:total>=0\.72&&publication\.eligible/);
 assert.match(src,/businessEvidence\?\.admissible!==false/);
});
