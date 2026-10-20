import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const emailLearningScopedRefresh=readFileSync(new URL('../supabase/migrations/20261020174501_email_learning_stats_scoped_refresh_v1.sql',import.meta.url),'utf8');
test('email learning refresh cannot clear other owners or disable database guards',()=>{
 const statements=emailLearningScopedRefresh.replace(/--[^\n]*/g,'').split(';');
 for(const statement of statements){
  if(/delete\s+from\s+/i.test(statement)){
   assert.match(statement,/where\s+[\s\S]*s\.channel\s*=\s*'email'/i);
   assert.match(statement,/s\.evidence->>'contract'\s*=\s*'powerhouse-email-reply-learning-v1'/);
   assert.doesNotMatch(statement,/\bwhere\s+(true|1\s*=\s*1)\b/i);
  }
 }
 assert.doesNotMatch(emailLearningScopedRefresh,/\btruncate\b|disable\s+(?:trigger|row\s+level\s+security)|set\s+session_replication_role|security\s+definer/i);
 assert.doesNotMatch(emailLearningScopedRefresh,/delete\s+from\s+public\.powerhouse_(?:sales_actions|email_reply_events|sales_outcomes)/i);
 assert.match(emailLearningScopedRefresh,/\$function\$;\s+DO \$readback\$/);
 assert.match(emailLearningScopedRefresh,/EMAIL_LEARNING_REFRESH_BASELINE_DRIFT/);
 assert.match(emailLearningScopedRefresh,/EMAIL_LEARNING_REFRESH_PRIVILEGE_DRIFT/);
});
