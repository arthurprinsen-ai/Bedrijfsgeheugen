import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const l=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
test('original native Supabase 832 already-applied versions remain exact and next repair not predeclared',()=>{
 assert.equal(l.source,'supabase_migration_history');assert.equal(l.project_ref,'adhjwmvyoixzjtmiroln');assert.equal(l.applied.length,832);
 assert.deepEqual(l.applied.at(-1),{version:'20261112184500',name:'original_daily_post_publication_metric_ack_v1'});
 assert.equal(new Set(l.applied.map(v=>v.version)).size,832);
 assert.equal(l.applied.filter(v=>v.version==='20261112194500').length,0);
 assert.match(readFileSync(new URL('../supabase/migrations/20261112184500_original_daily_post_publication_metric_ack_v1.sql',import.meta.url),'utf8'),/posts_publication_and_metrics/);
});
