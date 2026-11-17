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
  assert.equal(result.reason,'VENDOR_ANNOUNCEMENT_NOT_OBSERVED_OPERATIONAL_FRICTION');
 }
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
