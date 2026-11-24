import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {samePublicCompanyHost,publicCompanyContactLinks,publishedBusinessMailto,firstPartyDailyRotationOffset,firstPartySourceRetryHours,firstPartySourceRetryDue} from '../supabase/functions/_shared/public-business-email-evidence.mjs';

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
 assert.match(src,/readBoundedPublicPage\(homeUrl,sourceDiagnostics\)/);
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

test('due same-day original source research is not silently starved by daily eight-new-company cap',()=>{
 const due={public_email_source_checked:false,public_email_next_attempt_at:'2026-11-15T18:05:05.016Z'};
 const today='relationship-research:public-domain:2026-11-15:contact-a';
 const yesterday='relationship-research:public-domain:2026-11-14:contact-a';
 const tomorrow='relationship-research:public-domain:2026-11-16:contact-a';
 assert.equal(firstPartySourceRetryDue(today,due,'2026-11-15T18:05:06Z'),true,'same-day due must recover with original ID');
 assert.equal(firstPartySourceRetryDue(today,due,'2026-11-15T18:05:04Z'),false,'never retry before original due');
 assert.equal(firstPartySourceRetryDue(yesterday,due,'2026-11-15T18:05:06Z'),true,'prior-day due remains recovered');
 assert.equal(firstPartySourceRetryDue(tomorrow,due,'2026-11-15T18:05:06Z'),false,'future-dated original action must not run early');
 assert.equal(firstPartySourceRetryDue(today,{...due,public_email_source_checked:true},'2026-11-15T18:05:06Z'),false,'proved source is terminal');
 assert.equal(firstPartySourceRetryDue(today,{...due,public_email_next_attempt_at:null},'2026-11-15T18:05:06Z'),false,'invalid due is not authority');
 assert.equal(firstPartySourceRetryDue('relationship-research:outreach-source:fake',due,'2026-11-15T18:05:06Z'),false,'never touch other source lineage');
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(src,/\.lte\('evidence->>public_email_next_attempt_at',observedAt\)/);
 assert.match(src,/if\(retried>=2\)break/);
 assert.match(src,/processOriginalFirstPartyPublicSource\(/);
 assert.match(src,/original_lineage_reused:true,new_provider_queries:0,external_messages_sent:0/);
 assert.doesNotMatch(src,/key\.includes\(':'\+today\+':'\)/);
});

test('Amsterdam midnight never drops prior-day original source attempts or adds a parallel process',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(src,/async function replayDueHistoricalFirstPartySources/);
 assert.match(src,/evidence->>public_email_next_attempt_at/);
 assert.match(src,/\.lte\('evidence->>public_email_next_attempt_at',observedAt\)/);
 assert.match(src,/firstPartySourceRetryDue\(key,action\.evidence,observedAt\)/);
 assert.doesNotMatch(src,/key\.includes\(':'\+today\+':'\)/);
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

test('same original public research attempts use bounded backoff and never disappear from debt',()=>{
 assert.deepEqual([1,2,3,4,5,6,12].map(firstPartySourceRetryHours),[4,8,16,32,48,48,48]);
 assert.equal(firstPartySourceRetryHours(0),4);
 assert.equal(firstPartySourceRetryHours(NaN),4);
 assert.equal(firstPartySourceRetryHours(-3),4);
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(src,/firstPartySourceRetryHours\(attemptNumber\)/);
 assert.match(src,/sourceDiagnostics:string\[\]=\[\]/);
 assert.match(src,/public_email_source_failure_codes:sourceFailureCodes/);
 assert.match(src,/public_email_source_retry_hours:retryHours/);
 assert.match(src,/public_email_source_checked:checked/);
 assert.match(src,/public_email_next_attempt_at:nextAttemptAt/);
 assert.match(src,/original_lineage_reused:true,new_provider_queries:0,external_messages_sent:0/);
 assert.doesNotMatch(src,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|APOLLO_PEOPLE_ENRICHMENT/);
});

test('public website HTML failure codes are safe, bounded, actionable and do not permit arbitrary redirect',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 for(const classification of [
  'UNSAFE_OR_INVALID_SOURCE_URL','REDIRECT_LIMIT_REACHED','REDIRECT_UNSAFE_OR_CROSS_HOST',
  'SOURCE_ACCESS_DENIED_OR_RATE_LIMITED','SOURCE_HTTP_UPSTREAM_5XX','SOURCE_HTTP_NON_SUCCESS',
  'SOURCE_NOT_HTML','SOURCE_HTML_TRUNCATED','SOURCE_HTML_TRUNCATED_UNVERIFIED','SOURCE_FETCH_TIMEOUT','SOURCE_NETWORK_OR_PARSE_FAILURE'
 ])assert.ok(src.includes(classification),classification);
 assert.match(src,/nextHost!==companyHost/);
 assert.match(src,/next\.protocol!=='https:'/);
 assert.match(src,/signal:AbortSignal\.timeout\(2500\)/);
 assert.match(src,/sourceDiagnostics\.length<8/);
 assert.match(src,/public_email_source_diagnostics_recorded_at:observedAt/);
 assert.doesNotMatch(src,/res\.text\(/);
 const sourceReader=src.slice(src.indexOf('async function readBoundedPublicPage('),src.indexOf('async function writePublicBusinessSourceReceipt'));
 assert.doesNotMatch(sourceReader,/headers:\s*\{[^}]*authorization/i);
});
