import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261020163500_p0_4215_evidence_forecast_direct_lookup.sql',import.meta.url),'utf8');
test('evidence maturity uses only direct forecast source and preserves forecasts sorting policy',()=>{
 assert.match(sql,/CREATE OR REPLACE VIEW public\.powerhouse_action_evidence_maturity_v1 AS/);
 assert.match(sql,/LEFT JOIN public\.powerhouse_opportunities opp ON opp\.opportunity_key=bv\.opportunity_key/);
 assert.match(sql,/LEFT JOIN LATERAL \(/);
 assert.match(sql,/pf\.status IN \('active','claimed'\)/);
 assert.match(sql,/lower\(pf\.scope_key\)=lower\(opp\.company_key\)/);
 assert.match(sql,/pf\.topic_key=opp\.topic_key/);
 assert.match(sql,/lower\(pf\.scope_key\)=lower\(opp\.person_key\)/);
 assert.match(sql,/pf\.updated_at DESC/);
 assert.match(sql,/LIMIT 1/);
 assert.doesNotMatch(sql,/LEFT JOIN powerhouse_commercial_next_best_action_v4 nba ON/);
});
test('source proof and migration remain fail closed without role or scheduler changes',()=>{
 assert.match(sql,/CREATE UNIQUE INDEX%/);
 assert.match(sql,/MATURITY_VIEW_DRIFT_GUARD_FAILED/);
 assert.match(sql,/lock_timeout = '2s'/);
 assert.match(sql,/statement_timeout = '15s'/);
 assert.match(sql,/forecast_calibration AS/);
 assert.match(sql,/human_feedback AS/);
 assert.match(sql,/LEFT JOIN channel_counts cc ON/);
 assert.match(sql,/calibration_eligible/);
 assert.doesNotMatch(sql,/(?:GRANT\s+|REVOKE\s+|cron\.alter_job|cron\.unschedule|DROP TABLE|TRUNCATE)/i);
});
