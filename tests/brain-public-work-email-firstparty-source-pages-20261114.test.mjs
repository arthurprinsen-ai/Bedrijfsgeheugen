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

test('Amsterdam midnight never drops prior-day original source attempts or adds a parallel process',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(src,/async function replayDueHistoricalFirstPartySources/);
 assert.match(src,/evidence->>public_email_next_attempt_at/);
 assert.match(src,/\.lte\('evidence->>public_email_next_attempt_at',observedAt\)/);
 assert.match(src,/key\.includes\(':'\+today\+':'\)/);
 assert.match(src,/async function processOriginalFirstPartyPublicSource/);
 assert.match(src,/processOriginalFirstPartyPublicSource\(\s*db,action,domain,company,key,observedAt,action\.evidence\)/);
 assert.match(src,/const overdue=await replayDueHistoricalFirstPartySources\(db,observedAt\)/);
 assert.match(src,/freeDomain\.historical_due_retries=overdue/);
 assert.match(src,/public_email_source_attempts:/);
 assert.match(src,/original_lineage_reused:true,new_provider_queries:0/);
 assert.doesNotMatch(src,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT/);
});

test('original #116 differentiates unreadable HTML from genuinely observed no named mailto, never false-green',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(src,/status:checked>0\?'NO_EXPLICIT_NAMED_OFFICIAL_MAILTO':'SOURCE_HTML_UNAVAILABLE'/);
 assert.match(src,/if\(result\.status==='SOURCE_HTML_UNAVAILABLE'\)htmlUnavailable\+\+/);
 assert.match(src,/if\(result\.status==='NO_EXPLICIT_NAMED_OFFICIAL_MAILTO'\)noNamedMailto\+\+/);
 assert.match(src,/freeDomain\.html_unavailable>0\?'waarschuwing':'ok'/);
 assert.match(src,/public_email_next_attempt_at:nextAttemptAt/);
 assert.match(src,/public_email_source_checked:checked/);
 assert.match(src,/replayDueHistoricalFirstPartySources\(db,observedAt\)/);
 assert.match(src,/original_lineage_reused:true,new_provider_queries:0,external_messages_sent:0/);
 assert.doesNotMatch(src,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT/i);
});
