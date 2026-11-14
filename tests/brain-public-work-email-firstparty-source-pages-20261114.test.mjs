import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {samePublicCompanyHost,publicCompanyContactLinks,publishedBusinessMailto} from '../supabase/functions/_shared/public-business-email-evidence.mjs';

test('only HTTPS same-company host redirects and discovered links; never off-site URLs',()=>{
 assert.equal(samePublicCompanyHost('https://acmeresearch.com/','https://www.acmeresearch.com/over-ons/'),true);
 assert.equal(samePublicCompanyHost('https://www.acmeresearch.com/','https://acmeresearch.com/'),true);
 assert.equal(samePublicCompanyHost('https://acmeresearch.com/','https://attacker.example/team'),false);
 assert.equal(samePublicCompanyHost('https://acmeresearch.com/','http://acmeresearch.com/team'),false);
 assert.equal(samePublicCompanyHost('https://acmeresearch.com/','https://127.0.0.1/team'),false);
 const html='<a href="/contact/">Contact</a><a href="https://evil.example/team">Team offsite</a><a href="/over-ons/team/">Our team</a><a href="/about/">About</a>';
 assert.deepEqual(publicCompanyContactLinks(html,'https://acmeresearch.com/','Acme Research',2),[
   'https://acmeresearch.com/over-ons/team/','https://acmeresearch.com/about/'
 ]);
 assert.deepEqual(publicCompanyContactLinks('<a href="//attacker.example/people">X</a>','https://acmeresearch.com/','Acme Research',2),[]);
});
test('original first-party worker derives real contact paths from homepage and uses a bounded same-host redirect',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(src,/readBoundedPublicPage\(homeUrl\)/);
 assert.match(src,/nextHost!==companyHost/);
 assert.match(src,/publicPages=homeHtml/);
 assert.match(src,/publishedLinks\.length\?\[\]:\[/);
 assert.match(src,/publicCompanyContactLinks\(homeHtml,homeUrl,company,1\)/);
 assert.match(src,/nextHost!==companyHost/);
 assert.match(src,/next\.protocol!=='https:'/);
 assert.match(src,/redirect:'manual'/);
 assert.match(src,/redirect:'manual'/);
 assert.match(src,/AbortSignal\.timeout\(2500\)/);
 assert.match(src,/timeZone:'Europe\/Amsterdam'/);
 assert.match(src,/public_email_next_attempt_at/);
 assert.match(src,/public_email_source_checked/);
 assert.match(src,/public_email_source_status/);
 assert.match(src,/FIRST_PARTY_RESEARCH_DISPOSITION_ACK/);
 assert.match(src,/new_provider_queries:0/);
 assert.doesNotMatch(src,/cron\.schedule\s*\(|APOLLO_PEOPLE_ENRICHMENT|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER/);
});
test('named public business address remains a non-sendable evidence candidate, not delivery permission',()=>{
 const html='<main>Acme Research <p>Jane Doe <a href="mailto:jane@acmeresearch.com">Mail Jane</a></p></main>';
 const found=publishedBusinessMailto({html,sourceUrl:'https://acmeresearch.com/over-ons/team/',personName:'Jane Doe',companyName:'Acme Research',observedAt:new Date().toISOString()});
 assert.equal(found?.email,'jane@acmeresearch.com');
 assert.equal(found?.deliverability,'UNVERIFIED');
 assert.equal(found?.send_authority,'NOT_INFERRED');
});
