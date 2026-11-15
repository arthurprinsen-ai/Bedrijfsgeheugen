import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {samePublicCompanyHost,publicCompanyContactLinks,publishedBusinessMailto,firstPartyDailyRotationOffset,originalPublicSourceRetryHours} from '../supabase/functions/_shared/public-business-email-evidence.mjs';

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
 assert.match(src,/readBoundedPublicPage\(homeUrl(?:,failedSourceReads)?\)/);
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
 assert.match(src,/freeDomain\.html_unavailable>0\|\|pendingPublicSource>0\|\|trackedRedirectsRejected>0\|\|wrappedRecovery\.recovered>0\?'waarschuwing':'ok'/);
 assert.match(src,/source_redirect_rejected:true/);
 assert.match(src,/ORIGINAL_PUBLIC_SOURCE_BACKLOG_READ/);
 assert.match(src,/original_public_email_source_retry_backlog:pendingPublicSource/);
 assert.match(src,/\.eq\('evidence->>public_email_source_checked','false'\)/);
 assert.match(src,/public_email_next_attempt_at:nextAttemptAt/);
 assert.match(src,/public_email_source_checked:checked/);
 assert.match(src,/replayDueHistoricalFirstPartySources\(db,observedAt\)/);
 assert.match(src,/original_lineage_reused:true,new_provider_queries:0,external_messages_sent:0/);
 assert.doesNotMatch(src,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT/i);
});

// Regression for 15 Nov 2026 P0: historical one-slot/day offset caused the
// same failing first-party companies to consume most of the next day's quota.
test('one canonical eight-slot daily cohort visits all 85 candidate companies in eleven days',()=>{
 const base=Date.parse('2026-11-15T00:00:00Z');
 const seen=new Set();
 for(let d=0;d<11;d++){
  const day=new Date(base+d*86400000).toISOString().slice(0,10);
  const offset=firstPartyDailyRotationOffset(day,85,8);
  assert.equal(offset,firstPartyDailyRotationOffset(day,85,8),'same day is stable');
  if(d<10){
   for(let i=0;i<8;i++)assert.equal(seen.has((offset+i)%85),false,'first 80 slots must be distinct');
  }
  for(let i=0;i<8;i++)seen.add((offset+i)%85);
 }
 assert.equal(seen.size,85);
 assert.equal(firstPartyDailyRotationOffset('bad',85,8),0);
 assert.equal(firstPartyDailyRotationOffset('2026-11-15',0,8),0);
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(src,/firstPartyDailyRotationOffset\(day,entries\.length,8\)/);
 assert.match(src,/rotation_step:8/);
 assert.match(src,/candidate_company_domains:entries\.length/);
 assert.match(src,/eligibleSlots<8/);
 assert.match(src,/new_provider_queries:0/);
 assert.doesNotMatch(src,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT/);
});

test('first-party HTML failures are source-specific, privacy-safe and move to bounded owner retry',()=>{
 assert.deepEqual([1,2,3,4,5,7,8,20].map(n=>originalPublicSourceRetryHours(n)),
   [4,4,12,12,24,24,48,48]);
 assert.equal(originalPublicSourceRetryHours(0),4);
 assert.equal(originalPublicSourceRetryHours(Infinity),4);
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 for(const code of ['UNSAFE_PUBLIC_SOURCE_URL','CROSS_HOST_OR_UNSAFE_REDIRECT','HTTP_STATUS_',
   'NON_HTML_RESPONSE','HTML_TOO_LARGE','FETCH_TIMEOUT_2500MS',
   'FETCH_NETWORK_OR_TLS_FAILURE']){
   assert.ok(src.includes(code),code);
 }
 assert.match(src,/public_email_source_failure_codes:checked\?\[\]:sourceFailureCodes/);
 assert.match(src,/public_email_source_retry_hours:checked\?null:retryHours/);
 assert.match(src,/VERIFY_ALTERNATIVE_LAWFUL_FIRST_PARTY_SOURCE_OR_BOUNDED_RETRY/);
 assert.match(src,/public_email_source_checked:checked/);
 assert.match(src,/recipient_send_authority_inferred:false,external_send_executed:false/);
 assert.match(src,/nextHost!==companyHost/);
 assert.doesNotMatch(src,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT/);
});
