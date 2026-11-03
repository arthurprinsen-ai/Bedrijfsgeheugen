import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { regulatoryFrameworkDigest, applyRegulatoryBaselineToPortalControls } from '../portal-v2/regulatory-baseline.js';

const monitor=readFileSync('tools/regulatory-source-monitor.py','utf8');
const ingest=readFileSync('tools/regulatory-brain-ingest.py','utf8');

test('unverified 202, short 200 and interstitial response cannot be projected as regulation',()=>{
  const py=String.raw`
import json, pathlib, runpy, sys, tempfile
from unittest.mock import patch
m=runpy.run_path('tools/regulatory-source-monitor.py',run_name='source_under_test')
src={'id':'eu-ai-act','framework':'EU_AI_ACT','authority':'EUR-Lex',
'jurisdiction':'EU','url':'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'}
base={'raw':b'<html>'+b'x'*5000+b'</html>','contentType':'text/html',
'status':200,'finalUrl':src['url']}
assert m['response_quality'](src,base)=='VERIFIED_HTTP_DOCUMENT'
for name,changes in [
 ('HTTP_202',{'status':202}),
 ('HTTP_403',{'status':403}),
 ('SHORT_200',{'raw':b'<html>denied</html>'}),
 ('REDIRECT_200',{'finalUrl':'https://untrusted.invalid/other'}),
 ('INTERSTITIAL_200',{'raw':b'<html><title>Just a moment</title>'+b'x'*5000+b'</html>'}),
 ('WRONG_TYPE',{'contentType':'application/json'})]:
    assert m['response_quality'](src,{**base,**changes}).startswith('UNVERIFIED_'),name

class Resp:
    status=202
    headers={'Content-Type':'text/html'}
    def __init__(self): self._raw=b'<html>'+b'x'*2000+b'</html>'
    def __enter__(self):return self
    def __exit__(self,*args):return False
    def read(self):return self._raw
    def geturl(self):return src['url']

with tempfile.TemporaryDirectory() as temp:
    root=pathlib.Path(temp)
    cfg=root/'config.json'
    cfg.write_text(json.dumps({'sources':[src]}))
    state=root/'state.json'
    previous={'id':'eu-ai-act','framework':'EU_AI_ACT','authority':'EUR-Lex',
      'contentSha256':'previously_observed','httpStatus':202}
    canonical={'schemaVersion':1,'contract':'powerhouse-regulatory-source-state-v1',
     'checkedAt':'2026-09-24T00:00:00Z','sources':{'eu-ai-act':previous}}
    state.write_text(json.dumps(canonical))
    checks=root/'checks.json'
    rawdir=root/'raw'
    import urllib.request
    argv=['regulatory-source-monitor.py','--config',str(cfg),'--state',str(state),
       '--checks',str(checks),'--raw-dir',str(rawdir)]
    with patch.object(sys,'argv',argv),patch.object(urllib.request,'urlopen',return_value=Resp()):
       assert m['main']()==0
    actual=json.loads(state.read_text())
    diag=json.loads(checks.read_text())['sources']['eu-ai-act']
    assert actual==canonical,'an unverified response must preserve the original projection'
    assert diag['httpStatus']==202
    assert diag['sourceContentVerified'] is False
    assert diag['verification']=='UNVERIFIED_HTTP_STATUS'
    assert diag['changed'] is False and diag['firstObservation'] is False
    assert diag['contentSha256'] is None and diag['rawSha256'] is None
    assert diag['diagnosticResponseSha256']
    assert not list(rawdir.rglob('*.bin')),'no 202 content may enter raw official source storage'
    Resp.status=200
    Resp._raw=b'<html><body>'+b'legislative source'*300+b'</body></html>'
    original_read=Resp.read
    Resp.read=lambda self: Resp._raw
    with patch.object(sys,'argv',argv),patch.object(urllib.request,'urlopen',return_value=Resp()):
       assert m['main']()==0
    actual=json.loads(state.read_text())
    diag=json.loads(checks.read_text())['sources']['eu-ai-act']
    assert actual['sources']['eu-ai-act']['contentSha256']!='previously_observed'
    assert diag['changed'] is True and diag['sourceContentVerified'] is True
    assert diag['verification']=='VERIFIED_HTTP_DOCUMENT'
    assert len(list(rawdir.rglob('*.bin')))==1
    Resp.read=original_read
`;
  const result=spawnSync('python3',['-c',py],{encoding:'utf8',timeout:20000});
  assert.equal(result.status,0, (result.stderr||'')+'\n'+(result.stdout||''));
});

test('only verified source metadata crosses from observation heartbeat into raw content ingest',()=>{
  assert.match(monitor,/sourceContentVerified/);
  assert.match(monitor,/UNVERIFIED_HTTP_STATUS/);
  assert.match(monitor,/if not verified:/);
  assert.match(monitor,/out\['sources'\]\[source\['id'\]\]=previous/);
  assert.match(ingest,/source_content_verified/);
  assert.match(ingest,/meta\.get\('sourceContentVerified'\) is not True/);
  assert.match(ingest,/meta\.get\('verification'\) != 'VERIFIED_HTTP_DOCUMENT'/);
  assert.ok(ingest.indexOf("if meta.get('sourceContentVerified') is not True") <
    ingest.indexOf("raw_path=pathlib.Path(args.raw_dir)"));
});

test('existing regulatory source watcher stays in one original schedule and cannot silently grant PR or content authority',()=>{
  const w=readFileSync('.github/workflows/regulatory-source-watch.yml','utf8');
  assert.match(w,/concurrency:\s*\n\s*group: regulatory-source-watch/);
  assert.match(w,/cron: '17 3 \* \* \*'/);
  assert.match(w,/Persist source heartbeat and immutable raw observations in Powerhouse Brain/);
  assert.match(w,/Open governed source-state candidate/);
  assert.match(w,/GitHub Actions is not permitted to create or approve pull requests|CANONICAL_REGULATORY_PR_PERMISSION_DENIED/);
  assert.match(w,/gh pr merge --auto --squash/);
});

test('regulatory portal cannot approve previously trusted controls on HTTP202 pseudo-baselines',()=>{
 const state={sources:{
  eur:{id:'eu-ai-act',framework:'EU_AI_ACT',httpStatus:202,contentSha256:'historical-challenge-html',changed:true},
  nis:{id:'eu-nis2-directive',framework:'NIS2_CBW',httpStatus:202,contentSha256:'historical-challenge-html'},
  nl:{id:'nl-cyberbeveiligingswet',framework:'NIS2_CBW',httpStatus:200,contentSha256:'ncsc-official-html'}
 }};
 assert.equal(regulatoryFrameworkDigest(state,'EU_AI_ACT'),null);
 assert.equal(regulatoryFrameworkDigest(state,'NIS2_CBW'),'nl-cyberbeveiligingswet:ncsc-official-html');
 const [control]=applyRegulatoryBaselineToPortalControls([{framework:'EU_AI_ACT',reviewed:true,approved:true,evidence:[{id:'kept'}]}],state);
 assert.equal(control.regulatoryReviewRequired,true);
 assert.equal(control.reviewed,false);
 assert.equal(control.approved,false);
 assert.equal(control.regulatorySourceVerification,'UNVERIFIED');
 assert.deepEqual(control.evidence,[{id:'kept'}]);
});
