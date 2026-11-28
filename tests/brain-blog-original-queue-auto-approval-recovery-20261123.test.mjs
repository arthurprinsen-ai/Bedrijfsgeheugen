import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decideBlogAutoApproval} from '../supabase/functions/_shared/blog-auto-approval.mjs';

const queue=readFileSync('supabase/functions/powerhouse-blog-queue/index.ts','utf8');
const workflow=readFileSync('.github/workflows/powerhouse-daily-blog.yml','utf8');
const source={publication_date:'2026-11-23',content_id:'blog:verified-twinfield',slug:'verified-twinfield',
  canonical_url:'https://www.bedrijfsgeheugen.nl/blog/verified-twinfield/',
  status:'GENERATED',generated_at:'2026-11-22T23:27:47.163688Z',evidence:{}};
const artifact={status:'content_ready',title:'Een praktisch Twinfield onderwerp',
  body:'Een controleerbare praktische uitleg voor ondernemers.',cta:'Lees de checklist'};
const decision={decision:'publish',state:'content_ready'};
const later=new Date('2026-11-23T09:29:00Z');

test('historical 23-Nov missed daily approval is genuinely eligible in original shared veto policy',()=>{
  const x=decideBlogAutoApproval({obligation:source,artifact,decision,now:later,today:'2026-11-23'});
  assert.equal(x.action,'APPROVE');
  assert.equal(x.code,'APPROVED_AFTER_VETO_WINDOW');
  assert.ok(x.gates.includes('official_date_truth'));
  assert.equal(decideBlogAutoApproval({obligation:{...source,evidence:{veto:{active:true}}},
    artifact,decision,now:later,today:'2026-11-23'}).code,'VETOED');
  assert.equal(decideBlogAutoApproval({obligation:{...source,publication_date:'2026-11-22'},
    artifact,decision,now:later,today:'2026-11-23'}).code,'STALE_REQUIRES_REVIEW');
  assert.equal(decideBlogAutoApproval({obligation:{...source,status:'LIVE_PROVEN'},
    artifact,decision,now:later,today:'2026-11-23'}).action,'SKIP');
});

test('the existing authentic queue reuses the original shared policy and canonical state RPC',()=>{
  assert.match(queue,/from '\.\.\/\_shared\/blog-auto-approval\.mjs'/);
  const admission=queue.indexOf('assessBlogQueueAdmission({');
  const regression=queue.indexOf('BLOG_APPROVAL_STATE_REGRESSION');
  const factual=queue.indexOf('assessOfficialBlogDateTruth({title:a.title');
  const rebind=queue.indexOf('o.slug=rebound.slug;o.content_id=rebound.content_id');
  const assessment=queue.indexOf('decideBlogAutoApproval({');
  const approval=queue.indexOf("db.rpc('record_content_publication_state',payload)");
  const sourceProof=queue.indexOf('BLOG_ORIGINAL_AUTO_APPROVAL_READBACK_MISSING');
  const originalQueueWrite=queue.indexOf("const queueStatus=clean(o?.status)==='APPROVED'?'APPROVED':'GENERATED'");
  assert.ok(admission>=0&&regression>admission&&factual>regression&&
    rebind>factual&&assessment>rebind&&approval>assessment&&
    sourceProof>approval&&originalQueueWrite>sourceProof,
    'veto, regenerated-state regression, official fact, original slug-CAS, approval and independent readback must remain ordered');
  assert.ok(queue.includes("p_status:'APPROVED'"));
  assert.ok(queue.includes('BLOG_VETO_WINDOW_HOURS'));
  assert.ok(queue.includes('BLOG_ORIGINAL_AUTO_APPROVAL_RPC_FAILED'));
  assert.ok(queue.includes("if(o){o.status='APPROVED'"));
  assert.ok(queue.includes(".eq('tenant_id','canonical').eq('publication_date',runDate).eq('channel','blog')"));
  assert.ok(!queue.includes("status:'APPROVED',approved_at:new Date()"),'never direct status/approval update');
});

test('the original hourly GitHub writer verifies but never owns database approval or creates another scheduler',()=>{
  assert.ok(workflow.includes('Verify source-owned approval through original private blog exporter'));
  assert.ok(workflow.includes('BLOG_ORIGINAL_QUEUE_APPROVED_AND_EXPORT_PROVEN'));
  assert.ok(workflow.includes('BLOG_ORIGINAL_QUEUE_EXPORT_NOT_READY'));
  assert.ok(workflow.includes('BLOG_ORIGINAL_VETO_WINDOW_PENDING'));
  assert.ok(workflow.includes('powerhouse-blog-export?date='));
  assert.ok(workflow.includes('body.reader_ready!==true'));
  assert.doesNotMatch(workflow,/node tools\/content-growth\/blog-auto-approval\.mjs "\$DATE"/);
  assert.equal((workflow.match(/cron:/g)||[]).length,1);
  assert.ok(workflow.includes('Reconcile merged daily blog only after production HTTP and immutable release proof'));
  assert.ok(workflow.includes('powerhouse-daily-blog'));
});
