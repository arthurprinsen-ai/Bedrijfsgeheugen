import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const lock=JSON.parse(readFileSync('supabase/migration-history.lock.json','utf8'));
const file='supabase/migrations/20261123214500_personal_founder_perspective_v2_materializer_alignment.sql';
test('original provider 892nd protected identity is retained exactly without rewriting historical SQL',()=>{
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=892);
 assert.equal(lock.applied[890].version,'20261123211950');
 assert.deepEqual(lock.applied[891],{version:'20261123214500',name:'personal_founder_perspective_v2_materializer_alignment'});
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 const bytes=readFileSync(file);
 const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(blob,'cca0bd2169f330c7c33fafd9cce6eab28dd02215');
});
