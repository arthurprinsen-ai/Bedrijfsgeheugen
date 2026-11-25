import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyMiraRadarHttpStatus} from '../supabase/functions/_shared/mira-radar-http-status.mjs';

const source=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');

test('actual Mira source selection acknowledges an independent business winner even while personal user-fact source is unverified',()=>{
 assert.match(source,/const miraBusinessSourceReady=supply\.ok&&errors\.length===0;/);
 assert.match(source,/const allSourceReady=miraBusinessSourceReady&&personalPublishingSourceReady;/);
 assert.match(source,/ok:miraBusinessSourceReady,/);
 assert.match(source,/state:!miraBusinessSourceReady\?'SOURCE_RECOVERY_DUE':allSourceReady\?'SOURCE_READY':'MIRA_SOURCE_READY_PERSONAL_RECOVERY_DUE'/);
 assert.match(source,/miraBusinessSourceState:miraBusinessSourceReady\?'SOURCE_READY':'SOURCE_RECOVERY_DUE'/);
 assert.match(source,/allSourceReady,/);
 assert.match(source,/classifyMiraRadarHttpStatus\(\{sourceReady:miraBusinessSourceReady,errors\}\)/);
 assert.doesNotMatch(source,/sourceReady:allSourceReady/);
 assert.equal(classifyMiraRadarHttpStatus({sourceReady:true,errors:[]}),200);
});

test('personal first-person source and provider error gates are NEVER relaxed by business HTTP acknowledgement',()=>{
 assert.match(source,/personalSourceState:!personalStoryDue\?'NOT_DUE':personalPublishingSourceReady\?'SOURCE_READY':'SOURCE_RECOVERY_DUE'/);
 assert.match(source,/personalSourceRecovery:personalPublishingSourceReady\?null:\{owner:'powerhouse-content-orchestrator/);
 assert.match(source,/reason:'PERSONAL_USER_EXPERIENCE_NOT_VERIFIED',public_news_not_authority:true,sendsAuthorized:false/);
 assert.match(source,/personalFirstPersonSourceViolations\(candidate\.evidence\|\|\{\},runDate\)/);
 assert.match(source,/brain_observe_failure/);
 assert.equal(classifyMiraRadarHttpStatus({sourceReady:false,errors:[]}),503);
 assert.equal(classifyMiraRadarHttpStatus({sourceReady:true,errors:['SOURCE_WRITEBACK_FAILED']}),502);
 assert.doesNotMatch(source,/INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH|cron\.schedule\s*\(/);
});
