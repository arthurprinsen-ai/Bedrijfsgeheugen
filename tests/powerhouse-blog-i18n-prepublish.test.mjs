import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILDER = path.join(REPO,'tools/site-shell/build-localized-routes.mjs');
const html = `<!doctype html><html lang="nl"><head><title>Mijn proefpagina</title>
<meta name="description" content="Een nieuwe tekst"></head>
<body><h1>Hallo ondernemer</h1></body></html>`;

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'bg-i18n-prepublish-'));
  fs.mkdirSync(path.join(dir,'blog','proef'),{recursive:true});
  fs.mkdirSync(path.join(dir,'site'),{recursive:true});
  fs.writeFileSync(path.join(dir,'blog','proef','index.html'),html);
  fs.writeFileSync(path.join(dir,'site','seo-locale-revenue-map.json'),JSON.stringify({pages:[]}));
  fs.writeFileSync(path.join(dir,'sitemap.xml'),
    '<urlset><url><loc>https://www.bedrijfsgeheugen.nl/blog/proef/</loc></url></urlset>');
  return dir;
}

function run(dir,args,env={}) {
  return spawnSync(process.execPath,args,{cwd:dir,encoding:'utf8',
    env:{...process.env,STATIC_I18N_NETWORK:'0',STATIC_I18N_REQUIRE_CACHE:'0',...env}});
}

test('daily publisher prepares a durable minimal English patch, validates, and is idempotent', () => {
  const dir=fixture();
  try {
    const preload=path.join(dir,'mock-provider.cjs');
    fs.writeFileSync(preload,`
globalThis.fetch = async (_url, options) => {
  const request = JSON.parse(options.body);
  const inputs = JSON.parse(request.messages[0].content);
  return {ok:true, json:async () => ({content:[{type:'text',
    text:JSON.stringify(inputs.map(source => 'English: ' + source))}]})};
};`);
    const patchName='powerhouse-blog-fixture.json';
    const prepared=run(dir,['--require',preload,BUILDER,'--prepare-cache='+patchName],
      {STATIC_I18N_NETWORK:'1',ANTHROPIC_API_KEY:'mock-only'});
    assert.equal(prepared.status,0,prepared.stderr || prepared.stdout);
    const patchPath=path.join(dir,'config','bg-static-i18n-en.d',patchName);
    assert.ok(fs.existsSync(patchPath),'a scoped patch must be persisted');
    const patch=JSON.parse(fs.readFileSync(patchPath,'utf8'));
    assert.equal(patch['Hallo ondernemer'],'English: Hallo ondernemer');
    assert.equal(patch['Een nieuwe tekst'],'English: Een nieuwe tekst');
    assert.ok(!fs.existsSync(path.join(dir,'config','bg-static-i18n-en.json')),
      'do not rewrite the global translation cache');
    assert.ok(!fs.existsSync(path.join(dir,'en','blog','proef','index.html')),
      'prepublish must not render output files');

    const validate=run(dir,[BUILDER,'--validate-cache'],
      {STATIC_I18N_REQUIRE_CACHE:'1'});
    assert.equal(validate.status,0,validate.stderr || validate.stdout);
    const snapshot=fs.readFileSync(patchPath,'utf8');
    const replay=run(dir,[BUILDER,'--prepare-cache='+patchName]);
    assert.equal(replay.status,0,replay.stderr || replay.stdout);
    assert.equal(fs.readFileSync(patchPath,'utf8'),snapshot,'idempotent replay');
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});

test('missing translations fail closed without an authorized translation provider', () => {
  const dir=fixture();
  try {
    const result=run(dir,[BUILDER,'--prepare-cache=powerhouse-blog-fixture.json']);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/STATIC_I18N_PREPARE_NETWORK_REQUIRED/);
    assert.ok(!fs.existsSync(path.join(dir,'config','bg-static-i18n-en.d',
      'powerhouse-blog-fixture.json')));
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
