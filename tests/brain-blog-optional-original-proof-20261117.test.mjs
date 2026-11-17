import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const helper=fileURLToPath(new URL('../tools/content-growth/reviewed-blog-refresh.mjs',import.meta.url));
const date='2026-11-16';
const repo='arthurprinsen-ai/Bedrijfsgeheugen';
const head='a'.repeat(40);
const canonical='https://www.bedrijfsgeheugen.nl/blog/topic/';
const pr={state:'open',draft:true,head:{sha:head,ref:'automation/powerhouse-blog-'+date,repo:{full_name:repo}},base:{ref:'main'},body:'Obligation-ID: content-publication:'+date+':blog'};
const artifact={ok:true,run_date:date,slug:'topic',canonical_url:canonical,reader_ready:true,body:'New independently approved reader copy',blog_quality_repair:{contract:'same-obligation-unsent-blog-quality-repair-v1',rejected_body_sha256:'b'.repeat(64),rejection_codes:['EDITORIAL_PUBLICATION_INSTRUCTIONS']}};
function check({proofExists=false,brokenReview=false}={}){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'original-blog-proof-'));
 try {
  const p=path.join(temp,'pr.json'),a=path.join(temp,'artifact.json'),q=path.join(temp,'review.json');
  fs.writeFileSync(p,JSON.stringify(pr));
  fs.writeFileSync(a,JSON.stringify(brokenReview?{...artifact,blog_quality_repair:null}:artifact));
  if(proofExists)fs.writeFileSync(q,JSON.stringify({observed_evidence:{canonical_url:canonical}}));
  return spawnSync(process.execPath,[helper,p,a,q,date,repo,head],{encoding:'utf8',timeout:10000});
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
}
test('missing ORIGINAL review proof preserves the existing blog candidate without aborting workflow',()=>{
 const p=check();assert.equal(p.status,0,p.stderr);
 assert.equal(p.stdout.trim(),'PRESERVE');
 assert.match(p.stderr,/BLOG_REFRESH_ORIGINAL_PROOF_MISSING_PRESERVE_CANDIDATE/);
 assert.doesNotMatch(p.stdout,/AUTHORIZED/);
});
test('existing genuine exact review proof allows only the existing original quality repair',()=>{
 const p=check({proofExists:true});assert.equal(p.status,0,p.stderr);
 assert.equal(p.stdout.trim(),'AUTHORIZED');
 assert.equal(p.stderr.trim(),'');
});
test('existing review evidence without exact quality-repair contract is never authorized',()=>{
 const p=check({proofExists:true,brokenReview:true});assert.equal(p.status,0,p.stderr);
 assert.equal(p.stdout.trim(),'PRESERVE');
});
