import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {directResearchSourceUrl,researchSourceCandidate} from '../supabase/functions/_shared/relationship-research-feedback.mjs';

const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');

test('Google SERP tracking redirect is not a direct official publisher source',()=>{
 for(const url of [
  'https://google.com/goto?url=CAEShwEBfake',
  'https://www.google.com/url?q=https%3A%2F%2Fexample.com',
  'https://google.com/aclk?adurl=https://example.com',
  'https://bit.ly/a12',
  'http://example.com/news'
 ])assert.equal(directResearchSourceUrl(url),null,'must reject '+url);
 assert.equal(directResearchSourceUrl('https://www.yer.nl/training/praktisch-werken-met-ai-in-het-sociaal-domein/'),
  'https://www.yer.nl/training/praktisch-werken-met-ai-in-het-sociaal-domein/');
});

test('wrapped result never generates an original research-source candidate',()=>{
 const a={action_id:'4799d643-a891-4897-a49f-477383f57351',
  person_key:'contact',company_name:'YER',company_key:'yer',
  evidence:{original_outreach_action_id:'e5047182-405c-43f2-8c25-7674f1a2cb70'}};
 const result=researchSourceCandidate(a,{
  title:'Praktisch werken met AI in het sociaal domein - YER',
  summary:'AI training YER',trigger_type:'ai_data_digitalisation',
  url:'https://google.com/goto?url=CAEShwEBfake'
 },new Date().toISOString());
 assert.equal(result,null);
});

test('same existing first-party and SERP worker ignores tracked redirect, and marks snippets UNVERIFIED',()=>{
 assert.match(src,/directOrganic=organic\.filter\(\(x:any\)=>Boolean\(directResearchSourceUrl\(x\?\.url\)\)\)/);
 assert.match(src,/await ingestPublicWorkEmail\(db,action,directOrganic,observedAt\)/);
 assert.match(src,/for\(const item of directOrganic\)/);
 assert.match(src,/data_quality:'UNVERIFIED_SERP_SNIPPET'/);
 assert.match(src,/source_page_independently_read:false,provider_send_authorized:false/);
 assert.match(src,/tracked_serp_redirects_rejected:trackedRedirectsRejected/);
 assert.doesNotMatch(src,/data_quality:'VERIFIED',confidence/);
});

test('original rejected source safely replays ONLY original #116 action and original recipient ACK',()=>{
 assert.match(src,/recoverWrappedOriginalResearchSources\(db,observedAt\)/);
 assert.match(src,/\.like\('dedupe_key','relationship-research:outreach-source:%'\)/);
 assert.match(src,/\.eq\('status','done'\)/);
 assert.match(src,/if\(recovered>=5\)break/);
 assert.match(src,/researchRetryAt\(observedAt,24\)/);
 assert.match(src,/researchNoSourceFeedback\(a,owner,observedAt,next\)/);
 assert.match(src,/source_redirect_rejected:true/);
 assert.match(src,/\.update\(\{status:'waiting',due_at:next,source_url:'',evidence,updated_at:observedAt\}\)/);
 assert.doesNotMatch(src,/\.update\(\{status:'waiting',due_at:next,source_url:null,evidence,updated_at:observedAt\}\)/);
 assert.match(src,/source_url:null,rejected_source_url:source/);
 assert.match(src,/\.eq\('updated_at',a.updated_at\)/);
 assert.match(src,/\.in\('status',\['prepared','waiting'\]\)/);
 assert.match(src,/status:'SOURCE_REDIRECT_REJECTED_NOT_VERIFIED'/);
 assert.match(src,/provider_send_authorized:false/);
 assert.match(src,/external_outreach_executed:false,new_scheduler:false,new_provider_queries:0/);
 assert.doesNotMatch(src,/GMAIL_SEND_EMAIL|GMAIL_CREATE_DRAFT|cron\.schedule\s*\(/);
});
