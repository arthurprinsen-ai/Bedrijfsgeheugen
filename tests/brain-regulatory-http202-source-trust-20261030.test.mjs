import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('HTTP 202, empty pages and HTML challenges never promote a legal source baseline',()=>{
 const python=`
import contextlib,hashlib,importlib.util,io,json,pathlib,sys,tempfile
spec=importlib.util.spec_from_file_location('monitor','tools/regulatory-source-monitor.py')
mod=importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
source={'id':'eu-ai-act','framework':'EU_AI_ACT','authority':'EUR-Lex','jurisdiction':'EU','url':'https://eur-lex.europa.eu/eli/reg/2024/1689/oj'}
with tempfile.TemporaryDirectory() as d:
 root=pathlib.Path(d);config=root/'config.json';state=root/'state.json';checks=root/'checks.json';raw=root/'raw'
 config.write_text(json.dumps({'sources':[source]}),encoding='utf8')
 prior={'id':'eu-ai-act','framework':'EU_AI_ACT','url':source['url'],'contentSha256':'old-authoritative-body','checkedAt':'2026-10-01T00:00:00Z'}
 original={'schemaVersion':1,'contract':'powerhouse-regulatory-source-state-v1','checkedAt':'2026-10-01T00:00:00Z','sources':{'eu-ai-act':prior}}
 def run(status,body,ctype='text/html'):
  state.write_text(json.dumps(original),encoding='utf8')
  mod.fetch=lambda _: {'status':status,'raw':body,'stable':mod.stable_bytes(body,ctype),'contentType':ctype,'etag':None,'lastModified':None,'finalUrl':source['url']}
  sys.argv=['regulatory-source-monitor.py','--config',str(config),'--state',str(state),'--checks',str(checks),'--raw-dir',str(raw)]
  with contextlib.redirect_stdout(io.StringIO()): assert mod.main()==0
  return json.loads(state.read_text()),json.loads(checks.read_text())
 baseline,obs=run(202,b'<html><body>Received, please retry</body></html>')
 assert baseline==original,baseline
 c=obs['sources']['eu-ai-act']
 assert c['httpStatus']==202 and c['observationTrusted'] is False and c['unverifiedReason']=='HTTP_STATUS_NOT_200' and not c['changed'] and not c['firstObservation'],c
 assert (raw/'eu-ai-act'/(c['rawSha256']+'.bin')).exists()
 blank,diag=run(200,b'')
 assert blank==original and diag['sources']['eu-ai-act']['unverifiedReason']=='EMPTY_SOURCE_BODY'
 challenge,diag=run(200,b'<html><title>Just a moment</title><p>Enable JavaScript and cookies</p></html>')
 assert challenge==original and diag['sources']['eu-ai-act']['unverifiedReason']=='HTML_CHALLENGE_NOT_AUTHORITY'
 truebody=b'<html><body>Article 1: real authoritative legal document text, legitimate revision.</body></html>'
 valid,diag=run(200,truebody)
 expected=hashlib.sha256(mod.stable_bytes(truebody,'text/html')).hexdigest()
 assert valid['sources']['eu-ai-act']['contentSha256']==expected
 assert valid['sources']['eu-ai-act']['changed'] is True
 assert diag['sources']['eu-ai-act']['observationTrusted'] is True
 assert diag['sources']['eu-ai-act']['unverifiedReason'] is None
 # No false first observation when a source is unverified.
 original['sources']={}
 no_prior,diag=run(202,b'<html>accepted</html>')
 assert 'eu-ai-act' not in no_prior['sources'] and not diag['sources']['eu-ai-act']['firstObservation']
print('REGULATORY_HTTP202_TRUST_GATE_PASSED')
`;
 const output=execFileSync('python3',['-c',python],{encoding:'utf8',timeout:25000});
 assert.match(output,/REGULATORY_HTTP202_TRUST_GATE_PASSED/);
});

test('original Brain ingest retains raw diagnostic but never declares untrusted 202 as fresh authority',()=>{
 const ingest=readFileSync('tools/regulatory-brain-ingest.py','utf8');
 const monitor=readFileSync('tools/regulatory-source-monitor.py','utf8');
 assert.match(ingest,/meta\.get\('observationTrusted'\) is True/);
 assert.match(ingest,/freshness_heartbeat/);
 assert.match(ingest,/unverified_reason/);
 assert.match(ingest,/powerhouse_record_source_observation_v1/);
 assert.match(monitor,/unverified_response_reason/);
 assert.match(monitor,/out\['sources'\]\[source\['id'\]\]=previous/);
 assert.match(monitor,/raw_path\.write_bytes\(result\['raw'\]\)/);
});
