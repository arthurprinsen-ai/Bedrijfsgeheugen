import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('native blog submission matches the live Notion title property type before any network write',()=>{
  const workflow=readFileSync('.github/workflows/native-approved-blog-supply.yml','utf8');
  const scripts=[...workflow.matchAll(/python3 - <<'PY'\n([\s\S]*?)\n          PY/g)];
  assert.ok(scripts.length>=2);
  const script=scripts.at(-1)[1].split('\n').map(line=>line.replace(/^          /,'')).join('\n');
  const dir=mkdtempSync(join(tmpdir(),'bg-notion-contract-'));
  try {
    mkdirSync(join(dir,'tmp'));
    writeFileSync(join(dir,'tmp/native-approved-blog.json'),JSON.stringify({title:'Een betrouwbare kennisoverdracht organiseren',slug:'betrouwbare-kennisoverdracht',keyword:'kennisoverdracht',meta:'Maak kennis overdraagbaar met een duidelijke eigenaar, een werkbare instructie en een controle waarmee het team ziet of de overdracht echt lukt.',blogtext:'## De situatie\n\n'+'Deze informatie blijft bij de bron en helpt het team dagelijks verder. '.repeat(85)+'\n\n## De volgende stap',brain_reason:'Public aggregated content learning.'}));
    const harness=`import json,urllib.request\nclass Reply:\n def __enter__(self): return self\n def __exit__(self,*args): pass\n def read(self): return b'{"id":"test-only-page"}'\ndef checked(request,**kwargs):\n properties=json.loads(request.data)['properties']\n assert 'title' in properties['Titel'] and 'rich_text' not in properties['Titel'], 'Notion schema: Titel requires title, not rich_text'\n assert properties['Titel']['title'][0]['text']['content']=='Een betrouwbare kennisoverdracht organiseren'\n return Reply()\nurllib.request.urlopen=checked\nexec(${JSON.stringify(script)})`;
    const result=spawnSync('python3',['-c',harness],{cwd:dir,encoding:'utf8',env:{...process.env,NOTION_TOKEN:'test-only',NOTION_QUEUE_ID:'test-only',DATE:'2026-10-19',VERIFICATION_MODE:'false'}});
    assert.equal(result.status,0,result.stderr);
    assert.match(result.stdout,/NATIVE_APPROVED_BLOG_CREATED test-only-page/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
