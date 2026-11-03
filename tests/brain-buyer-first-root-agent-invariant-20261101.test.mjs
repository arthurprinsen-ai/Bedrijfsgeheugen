import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PERSONAL_EDITORIAL_POLICY,personalEditorialViolations} from '../supabase/functions/_shared/personal-linkedin-editorial-contract.mjs';
import {COMPANY_EDITORIAL_POLICY,companyEditorialViolations} from '../supabase/functions/_shared/company-linkedin-editorial-contract.mjs';

const agents=readFileSync('AGENTS.md','utf8');
const skill=readFileSync('.agents/skills/powerhouse-social-cro-funnel/SKILL.md','utf8');

test('original AGENTS contract permanently references the verified social incident and original provider safeguards',()=>{
 assert.match(agents,/P0_20261101_LINKEDIN_BUYER_FIRST_EDITORIAL_INVARIANT_V1/);
 assert.match(agents,/powerhouse\|linkedin\|public-internal-status-instead-of-buyer-story\|20261101-v1/);
 assert.match(agents,/no parallel scheduler/i);
 assert.match(agents,/next natural run/i);
 assert.match(agents,/Missing views=UNKNOWN/i);
 assert.match(skill,/PERSONAL_EDITORIAL_INTERNAL_METRICS_REPORT/);
 assert.match(skill,/COMPANY_INTERNAL_METRICS_REPORT/);
});

test('buyer-first agent contract remains enforced in source policies, not only in prose',()=>{
 assert.equal(PERSONAL_EDITORIAL_POLICY,'personal-linkedin-founder-editorial-v4');
 assert.equal(COMPANY_EDITORIAL_POLICY,'linkedin-company-entrepreneur-value-v2');
 const screenshot='Ik wil dat AI niet alleen signalen geeft, maar echte stappen helpt zetten. Vandaag 273 gemeten pagina’s, 30 bronnen en 280 acties klaargezet. De assurance-controle toonde 4 rode en 3 amber signalen in actieve loops. De ondernemer wil weten waarom werk blijft liggen. Mijn missie gaat over betere processen, echte mensen en meetbaar resultaat. Elke verandering moet worden beoordeeld zonder verzonnen cijfers, verkeerde aannames of gestuurde reacties. Ik weet nog niet hoe goed klanten dit gaan vinden. We moeten de volgende run eerst afwachten en onafhankelijk vergelijken wat ze wel en niet bereiken. Welke aanpak zouden jullie kiezen?';
 assert.ok(personalEditorialViolations(screenshot,{builder:true}).some(v=>v.code==='PERSONAL_EDITORIAL_GENERIC_AI_HOOK'));
 assert.ok(personalEditorialViolations(screenshot,{builder:true}).some(v=>v.code==='PERSONAL_EDITORIAL_INTERNAL_METRICS_REPORT'));
 const company='Ons systeem heeft vandaag 273 gemeten pagina’s en 30 bronnen gecontroleerd. De assurance-controle toonde 4 rode en 3 amber signalen in actieve loops. Voor klanten is de vraag of hun offertetraject op tijd wordt opgevolgd belangrijk. Veel bedrijven verliezen hierdoor tijd en dus geld. Ondernemers kunnen beter beginnen met inzicht in openstaande offertes, de verantwoordelijke medewerker en de gewenste opvolging. Zo worden keuzes concreter. Dit is nog geen bewijs van omzetgroei of meer betaalde orders, maar wel een praktisch vertrekpunt voor een eigen controle en werkproces.';
 assert.ok(companyEditorialViolations(company).some(v=>v.code==='COMPANY_INTERNAL_METRICS_REPORT'));
});

test('no implied auto-green: original portal explicitly treats post-level revenue as unverified',()=>{
 const portal=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 assert.match(portal,/PER_POST_IMPACT_UNVERIFIED/);
 assert.match(portal,/customerOrdersIndependentlyAttributed:false/);
});
