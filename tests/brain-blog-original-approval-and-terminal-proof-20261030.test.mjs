import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const renderer=readFileSync(new URL('../tools/site-shell/publish_powerhouse_blog_artifact.py',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../.github/workflows/powerhouse-daily-blog.yml',import.meta.url),'utf8');
const social=readFileSync(new URL('../.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md',import.meta.url),'utf8');
const skill=readFileSync(new URL('../.agents/skills/powerhouse-self-improvement-layer/SKILL.md',import.meta.url),'utf8');

test('blog workflow only defers original exporter approval, never reports provider live',()=>{
 assert.match(renderer,/BLOG_PUBLIC_EXPORT_NOT_APPROVED/);
 assert.match(renderer,/rejection.get\("runDate"\) == date/);
 assert.match(renderer,/NO_ACTION:AWAITING_ORIGINAL_PUBLICATION_APPROVAL:/);
 assert.match(workflow,/approval_state=AWAITING_ORIGINAL_PUBLICATION_APPROVAL/);
 assert.match(workflow,/changed=false/);
 assert.match(social,/approved_at=NULL/);
 assert.match(social,/Any other 403/);
});

test('original terminal proof must not substitute Brain foundation push for exact candidate dispatch',()=>{
 assert.match(skill,/TERMINAL_CRITICAL_GATE_NOT_TERMINAL:BRAIN/);
 assert.match(skill,/verification_only=true/);
 assert.match(skill,/BRAIN_HANDOFF_PROOF_MISSING/);
 assert.match(skill,/Brain foundation result/);
});

test('real Python HTTP 403 contract: exact dated approval pending is non-publish; other 403 and 401 fail',()=>{
 const script=String.raw`
import importlib.util,os,json,io,contextlib
from unittest.mock import patch
from urllib.error import HTTPError
from io import BytesIO
os.environ['SUPABASE_SERVICE_ROLE_KEY']='unit-test-non-secret'
os.environ.pop('POWERHOUSE_BLOG_SOURCE_SNAPSHOT',None)
spec=importlib.util.spec_from_file_location('bgblog','tools/site-shell/publish_powerhouse_blog_artifact.py')
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
def failure(status,code,date='2026-10-30'):
 return HTTPError('https://example.invalid',status,'Forbidden',{},BytesIO(json.dumps({'ok':False,'error':code,'runDate':date}).encode()))
with patch.object(m.urllib.request,'urlopen',side_effect=failure(403,'BLOG_PUBLIC_EXPORT_NOT_APPROVED')):
 result=m.fetch('2026-10-30')
 assert result=={'_original_publication_approval_pending':True,'run_date':'2026-10-30'},result
for status,code,date in [(403,'EXPORT_AUTH_REQUIRED','2026-10-30'),(403,'BLOG_PUBLIC_EXPORT_NOT_APPROVED','2026-10-29'),(401,'UNAUTHORIZED','2026-10-30')]:
 with patch.object(m.urllib.request,'urlopen',side_effect=failure(status,code,date)):
  try:m.fetch('2026-10-30')
  except HTTPError as exc: assert exc.code==status
  else:raise AssertionError('Security HTTP error was hidden: '+str(status)+':'+code)
with patch.object(m.urllib.request,'urlopen',side_effect=failure(404,'NO_APPROVED_BLOG_ARTIFACT')):
 assert m.fetch('2026-10-30') is None
with patch.object(m,'fetch',return_value={'_original_publication_approval_pending':True,'run_date':'2026-10-30'}):
 with patch.object(m.sys,'argv',['test','2026-10-30']):
  out=io.StringIO()
  with contextlib.redirect_stdout(out):m.main()
  assert out.getvalue().strip()=='NO_ACTION:AWAITING_ORIGINAL_PUBLICATION_APPROVAL:2026-10-30'
`;
 assert.doesNotThrow(()=>execFileSync('python3',['-c',script],{encoding:'utf8'}));
});
