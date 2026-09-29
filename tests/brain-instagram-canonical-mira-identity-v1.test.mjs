import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const cfg=JSON.parse(readFileSync('config/instagram-canonical-mira-identity-v1.json','utf8'));
const sql=readFileSync('supabase/migrations/20260929173500_instagram_canonical_mira_identity_guard_v1.sql','utf8');

test('Mira uses one fictional canonical identity reference',()=>{
  assert.equal(cfg.canonical_reference.reference_id,'Yjqu4D7v76HABNPmQPj1');
  assert.match(cfg.canonical_reference.source,/fictional AI character/i);
  assert.equal(cfg.forbidden_user_reference_ids.includes('Jt5SWKRgyK3heTqEXH4w'),true);
});
test('runtime rejects user photos and requires canonical Mira proof',()=>{
  assert.match(sql,/INSTAGRAM_USER_IDENTITY_FORBIDDEN_FOR_MIRA/);
  assert.match(sql,/INSTAGRAM_CANONICAL_MIRA_REFERENCE_REQUIRED/);
  assert.match(sql,/Yjqu4D7v76HABNPmQPj1/);
});
