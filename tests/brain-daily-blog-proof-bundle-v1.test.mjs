import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeDailyBlogProofBundle } from '../tools/content-growth/daily-blog-proof-bundle.mjs';

const artifact = {ok:true, slug:'eerlijke-bedrijfsinformatie', content_id:'blog:eerlijke-bedrijfsinformatie', canonical_url:'https://www.bedrijfsgeheugen.nl/blog/eerlijke-bedrijfsinformatie/'};
test('source-backed daily candidate atomically carries durable semantic Brain, activity and explanation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'powerhouse-proof-'));
  try {
    const a = writeDailyBlogProofBundle({date:'2026-10-25',artifact,root});
    assert.equal(a.status, 'CANDIDATE_NOT_LIVE_VERIFIED');
    assert.equal(a.files.length,3);
    const b = writeDailyBlogProofBundle({date:'2026-10-25',artifact,root});
    assert.deepEqual(b.files,a.files);
    const record=JSON.parse(fs.readFileSync(path.join(root,a.files[0]),'utf8'));
    assert.equal(record.observed_evidence.publication_state,'NOT_YET_LIVE_VERIFIED');
    assert.deepEqual(record.evaluation.historical_replay,['tests/brain-daily-blog-proof-bundle-v1.test.mjs']);
    assert.ok(fs.readFileSync(path.join(root,a.files[1]),'utf8').includes('independent provider/public readback'));
    assert.ok(fs.readFileSync(path.join(root,a.files[2]),'utf8').includes('not proof of live publication'));
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
test('unverified, malformed or wrong-origin candidates cannot create closure artifacts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'powerhouse-proof-'));
  try {
    for (const sample of [
      {date:'2026-02-30',artifact},
      {date:'2026-10-25',artifact:{...artifact,ok:false}},
      {date:'2026-10-25',artifact:{...artifact,slug:'../escape'}},
      {date:'2026-10-25',artifact:{...artifact,canonical_url:'https://example.com/blog/eerlijke-bedrijfsinformatie/'}},
      {date:'2026-10-25',artifact:{...artifact,canonical_url:'https://www.bedrijfsgeheugen.nl/blog/ander-artikel/'}}
    ]) assert.throws(() => writeDailyBlogProofBundle({...sample,root}),/BLOG_PROOF_/);
    assert.equal(fs.existsSync(path.join(root,'brain')),false);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
test('reviewed closure evidence cannot be overwritten by an unattended retry', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'powerhouse-proof-'));
  try {
    const a=writeDailyBlogProofBundle({date:'2026-10-25',artifact,root});
    fs.appendFileSync(path.join(root,a.files[1]),'\nReviewed.');
    assert.throws(()=>writeDailyBlogProofBundle({date:'2026-10-25',artifact,root}),/BLOG_PROOF_EXISTING_EVIDENCE_MISMATCH/);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
