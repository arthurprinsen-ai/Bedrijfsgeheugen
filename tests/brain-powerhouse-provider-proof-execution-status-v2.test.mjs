import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file = new URL('../supabase/migrations/20261015182500_powerhouse_provider_proof_execution_status_v2.sql', import.meta.url);
const sql = readFileSync(file, 'utf8');

test('execution status keeps its original callable contract and fail-closed completion',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_execution_status\(/i);
  assert.match(sql,/p_run_date date default current_date/i);
  assert.match(sql,/language sql\s+stable\s+set search_path/i);
  assert.match(sql,/unresolved_publish_count\s*=\s*0/i);
  assert.doesNotMatch(sql,/security definer/i);
});

test('provider URN without independent readback never counts as delivered',()=>{
  assert.match(sql,/coalesce\(\(/, 'NULL proof must never satisfy an obligation');
  assert.match(sql,/\), false\) as independently_proven/, 'missing provider JSON is an explicit failure, not SQL UNKNOWN');
  assert.match(sql,/delivery_evidence->>'provider_truth_verified' = 'true'/);
  assert.match(sql,/delivery_evidence->>'provider_status' = 'published'/);
  assert.match(sql,/nullif\(btrim\(delivery_ref\), ''\) is not null/);
  assert.match(sql,/state in \('published','measured','learned'\)/);
  assert.match(sql,/count\(\*\) filter \(where independently_proven\)/);
  assert.match(sql,/count\(\*\) filter \(where decision='publish' and not independently_proven\)/);
  assert.doesNotMatch(sql,/state='scheduled'/i);
});

test('social publication comes from provider-verified canonical decisions, not empty legacy social_posts',()=>{
  assert.match(sql,/channel in \('linkedin_company','linkedin_personal','instagram_company'\)/);
  assert.match(sql,/where independently_proven\s+and channel/i);
  assert.doesNotMatch(sql,/from public\.social_posts/i);
});

test('historical replay of 2026-10-15 blocks unverified personal while counting two verified deliveries',()=>{
  const rows=[
    {channel:'linkedin_company',decision:'publish',state:'published',ref:'urn:li:share:7516489347345334272',truth:true,status:'published'},
    {channel:'linkedin_personal',decision:'publish',state:'published',ref:'urn:li:share:7516487392590217216',truth:false,status:'published'},
    {channel:'blog',decision:'publish',state:'published',ref:'https://www.bedrijfsgeheugen.nl/blog/',truth:true,status:'published'},
    {channel:'instagram_company',decision:'hold',state:'blocked',ref:null,truth:false,status:null},
    {channel:'email_newsletter',decision:'hold',state:'blocked',ref:null,truth:false,status:null},
    {channel:'linkedin_article_company',decision:'hold',state:'blocked',ref:null,truth:false,status:null},
    {channel:'linkedin_article_personal',decision:'hold',state:'blocked',ref:null,truth:false,status:null},
  ];
  const independentlyProven = r=>r.decision==='publish' && ['published','measured','learned'].includes(r.state)
    && Boolean(r.ref?.trim()) && r.truth===true && r.status==='published';
  // A new decided channel has neither provider receipt nor evidence JSON.
  const missingReceipt={channel:'linkedin_personal',decision:'publish',state:'published',ref:null,truth:null,status:null};
  assert.equal(independentlyProven(missingReceipt),false);
  const publish=rows.filter(r=>r.decision==='publish');
  const delivered=publish.filter(independentlyProven);
  const social=delivered.filter(r=>['linkedin_company','linkedin_personal','instagram_company'].includes(r.channel));
  assert.equal(rows.length,7);
  assert.equal(publish.length,3);
  assert.equal(delivered.length,2);
  assert.equal(social.length,1);
  assert.equal(publish.length-delivered.length,1);
});
