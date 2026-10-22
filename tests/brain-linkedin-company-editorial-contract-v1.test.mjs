import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPANY_EDITORIAL_POLICY,companyEditorialViolations,companyStoryFamily} from '../supabase/functions/_shared/company-linkedin-editorial-contract.mjs';

const good='Een ondernemer heeft drie systemen, maar geen antwoord op één simpele vraag: welke offertes moeten vandaag worden opgevolgd? Sales kijkt in het CRM. Finance ziet de facturen. De werkvoorbereider heeft een eigen lijst. Niemand ziet wie de klant al heeft gesproken. Zo gaat kostbare tijd verloren en kan een kans blijven liggen. Bedrijfsgeheugen maakt die informatie op één plek bruikbaar, koppelt de bestaande systemen en helpt bepalen wie vandaag welke actie oppakt. Zonder dat je alle software hoeft te vervangen. Begin bij de vraag die je iedere ochtend beantwoord wilt hebben. Welke klant wacht er vandaag nog op een reactie? Bekijk de Frisse Blik op https://www.bedrijfsgeheugen.nl/frisse-blik.';
const old='Signaal: TKI Bouw en Techniek stelt €3 miljoen subsidie beschikbaar voor innovaties die bestaande gebouwen beter benutten. \nContext: voor bouwbedrijven is dit een kans.\nBeslissing: richt een MT-commissie in.';
test('company editorial policy is explicit and good entrepreneur-centred posts pass',()=>{
  assert.match(COMPANY_EDITORIAL_POLICY,/company-entrepreneur-value/);
  assert.deepEqual(companyEditorialViolations(good),[]);
});
test('short boardroom briefings and report-style openings fail closed',()=>{
  const codes=companyEditorialViolations(old).map(v=>v.code);
  assert.ok(codes.includes('COMPANY_READER_LENGTH_INVALID'));
  assert.ok(codes.includes('COMPANY_REPORT_OPENING_FORBIDDEN'));
  assert.ok(codes.includes('COMPANY_INTERNAL_MEMO_STRUCTURE'));
});
test('rephrasing the same TKI story cannot bypass historical semantic dedupe',()=>{
  const newer='TKI Bouw en Techniek maakte bekend dat er 3 miljoen euro subsidie beschikbaar is voor optoppen en splitsen. Dat is relevant voor bouwbedrijven die hun planning en kosten niet rond krijgen. Bouwers verliezen tijd omdat iedereen losse bronnen heeft en geen overzicht van wie de aanvraag oppakt. Bespreek het in het MT en bouw een pilot rond de subsidie om doorlooptijd te verkorten. Met een helder overzicht van beslissingen, eigenaren en resultaten maak je betere keuzes. Dit is geen garantie op subsidie, maar een manier om voorbereiding beter te organiseren. Lees wat bedrijfsgeheugen voor ondernemers kan betekenen en maak de eerste stap. https://www.bedrijfsgeheugen.nl/frisse-blik';
  assert.equal(companyStoryFamily(old),'tki-existing-buildings');
  assert.equal(companyStoryFamily(newer),'tki-existing-buildings');
  assert.ok(companyEditorialViolations(newer,{recentPosts:[old]}).some(v=>v.code==='COMPANY_RECENT_STORY_FAMILY_REPEAT'));
});
test('different customer problems are not treated as the same story',()=>{
  const unrelated='Bij een groeiend handelsbedrijf stapelt de voorraad zich op en blijft geld langer vaststaan. Dat merk je pas als facturen later worden betaald. De ondernemer ziet de omzet, maar mist de gevolgen voor de kasstroom. Door orders, voorraad en facturatie te verbinden, worden afwijkingen eerder zichtbaar. Dat betekent niet dat iedere voorspelling klopt. Wel kun je een vervolgstap kiezen, eigenaar aanwijzen en achteraf controleren wat werkte. Bedrijfsgeheugen helpt die kennis en acties vast te leggen, zonder je bestaande systemen te vervangen. Start met een Frisse Blik om te zien waar tijd of geld blijft liggen. https://www.bedrijfsgeheugen.nl/frisse-blik';
  assert.ok(!companyEditorialViolations(unrelated,{recentPosts:[good]}).some(v=>v.code.includes('REPEAT')||v.code.includes('DUPLICATE')));
});
