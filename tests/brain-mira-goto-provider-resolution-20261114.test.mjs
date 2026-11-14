import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectCanonicalRadarSourceQueries,RADAR_TOTAL_EXTERNAL_QUERIES} from '../supabase/functions/_shared/personal-observational-source-routing.mjs';
import {classifyMiraSourceUrl} from '../supabase/functions/_shared/mira-source-url-quality.mjs';

const source=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
test('the canonical existing eight DataForSEO Google News requests explicitly resolve goto URLs inside each same task',()=>{
  assert.match(source,/serp\/google\/news\/live\/advanced/);
  assert.match(source,/depth:20,resolve_goto_urls:true/);
  const queries=selectCanonicalRadarSourceQueries('2026-11-14');
  assert.equal(queries.length,RADAR_TOTAL_EXTERNAL_QUERIES);
  assert.equal(queries.filter(x=>x.channel==='instagram_company').length,6);
  assert.equal(queries.filter(x=>x.channel==='linkedin_personal').length,2);
  assert.match(source,/Promise\.all\(queries\.map\(async \(\{query:q\}\)=>/);
  assert.match(source,/const returned=sourceResponses\[sourceResponseIndex\+\+\]/);
  assert.match(source,/if\(returned\.error\)\{errors\.push\(q\+':'\+returned\.error\);continue\}/);
  assert.match(source,/const sr:any=returned\.result/);
});
test('unresolved Google redirects remain strictly rejected; no invented news or weakening',()=>{
  assert.equal(classifyMiraSourceUrl('https://google.com/goto?url=CAESwrong&gsessionid=abc').ok,false);
  assert.equal(classifyMiraSourceUrl('https://news.google.com/rss/articles/abc').ok,false);
  assert.equal(classifyMiraSourceUrl('https://example.nl/nieuws/echt-artikel').ok,true);
  assert.match(source,/if\(!classifyMiraSourceUrl\(sourceUrl\)\.ok\)\{reject\('REJECTED_SOURCE_URL_QUALITY'/);
  assert.match(source,/eligible:total>=0\.72&&publication\.eligible/);
  assert.match(source,/evaluateMiraPublicationFreshness\(/);
  assert.match(source,/source_publication_date_evidence:publication\.publishedAt\?'DATED':'UNVERIFIED'/);
  assert.match(source,/priorContract && priorContract!==row\.metadata\.contract/);
  assert.match(source,/brain_observe_failure/);
  assert.match(source,/classifyMiraRadarHttpStatus\(\{sourceReady:supply\.ok,errors\}\)/);
  assert.match(source,/sendsAuthorized:false/);
  assert.doesNotMatch(source,/cron\.schedule\(|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH/i);
});
test('same original source owner and account/asset gates remain documented',()=>{
  const agent=readFileSync('platform/agents/agent-team.mjs','utf8');
  const skill=readFileSync('.agents/skills/instagram-composio-publisher/SKILL.md','utf8');
  assert.match(agent,/repair-mira-google-news-goto-direct-publisher-url-with-original-provider-option/);
  assert.match(skill,/resolve_goto_urls:true/);
  assert.match(skill,/no extra paid search tasks/i);
  assert.match(skill,/powerhouse_claim_instagram_media_job_v1/);
  assert.match(skill,/0\.940/);
  assert.match(skill,/ONE BRAIN/);
});
