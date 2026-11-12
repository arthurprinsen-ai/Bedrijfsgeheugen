import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot=fileURLToPath(new URL('../',import.meta.url));
const injector=path.join(repositoryRoot,'tools/site-shell/apply-cms-runtime.mjs');
const css=fs.readFileSync(path.join(repositoryRoot,'assets/sitewide-mobile-ui-20261111.css'),'utf8');
const js=fs.readFileSync(path.join(repositoryRoot,'assets/sitewide-mobile-ui-20261111.js'),'utf8');
const gripCss=fs.readFileSync(path.join(repositoryRoot,'assets/grip-app-ui.css'),'utf8');
const gripJs=fs.readFileSync(path.join(repositoryRoot,'assets/grip-app-experience.js'),'utf8');

test('public site mobile repairs are script-valid and targeted, not an alternative executor',()=>{
  assert.doesNotThrow(()=>new Function(js));
  assert.match(css,/nav\.bgkop.*position:sticky|position:sticky!important/);
  assert.match(css,/#bgSharedMobileNav/);
  assert.match(css,/#bgMobileNav/);
  assert.match(css,/#compareFrame #compareRange/);
  assert.match(css,/\.pgl \.pgl-actions a\.pgl-btn\.secondary/);
  assert.match(js,/data-bg-sitewide-close/);
  assert.match(js,/frame\.dataset\.bgKnowledgeSide/);
  assert.match(js,/range\.dispatchEvent\(new Event\('input'/);
});

test('canonical last Netlify build phase injects the same public UX once per page, never into portal',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bg-sitewide-mobile-contract-'));
  const write=(relative,body)=>{
    const filename=path.join(tmp,relative);
    fs.mkdirSync(path.dirname(filename),{recursive:true});
    fs.writeFileSync(filename,body,'utf8');
  };
  try{
    write('site/.keep','');
    write('assets/sitewide-mobile-ui-20261111.css',css);
    write('assets/sitewide-mobile-ui-20261111.js',js);
    write('assets/grip-app-ui.css',gripCss);
    write('assets/grip-app-experience.js',gripJs);
    const page='<!doctype html><html lang="nl"><head><title>Test</title></head><body><main><h1>Page</h1></main></body></html>';
    for(const p of ['index.html','kennis/index.html','pages/contact.html','portal/index.html'])write(p,page);
    for(let i=0;i<2;i++){
      const result=spawnSync(process.execPath,[injector],{cwd:tmp,encoding:'utf8'});
      assert.equal(result.status,0,result.stderr||result.stdout);
    }
    for(const p of ['index.html','kennis/index.html','pages/contact.html']){
      const html=fs.readFileSync(path.join(tmp,p),'utf8');
      assert.equal((html.match(/id="bg-sitewide-mobile-ui-20261111"/g)||[]).length,1,p);
      assert.equal((html.match(/data-bg-sitewide-mobile-ui="1"/g)||[]).length,1,p);
      assert.match(html,/<script src="\/assets\/sitewide-mobile-ui-20261111\.js\?v=20261111b" defer/);
      assert.equal((html.match(/data-bg-app-manifest="1"/g)||[]).length,1,p);
      assert.equal((html.match(/data-bg-app-experience="1"/g)||[]).length,1,p);
      assert.equal((html.match(/id="bg-grip-app-ui-20261112"/g)||[]).length,1,p);
      assert.match(html,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/app\.webmanifest"/);
    }
    const portal=fs.readFileSync(path.join(tmp,'portal/index.html'),'utf8');
    assert.doesNotMatch(portal,/bg-sitewide-mobile-ui-20261111/);
    assert.doesNotMatch(portal,/data-bg-app-experience|data-bg-app-manifest|bg-grip-app-ui/);
  }finally{
    fs.rmSync(tmp,{recursive:true,force:true});
  }
});
