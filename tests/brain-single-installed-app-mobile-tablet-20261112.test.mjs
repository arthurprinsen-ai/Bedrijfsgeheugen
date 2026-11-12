import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('portal-v2/app.webmanifest'));
const common=read('assets/bg-app-experience.js');
const styles=read('assets/bg-app-experience.css');
const portalDevice=read('portal-v2/app-device-shell.css');
const sw=read('portal-v2/bg-app-sw.js');

test('one first-party PWA identity and original app target, valid 192 and 512 visual assets',()=>{
 assert.equal(manifest.id,'/bedrijfsgeheugen-app');
 assert.equal(manifest.start_url,'/portal-v2/');
 assert.equal(manifest.scope,'/');
 assert.equal(manifest.display,'standalone');
 assert.match(manifest.name,/Bedrijfsgeheugen/);
 const icon192=manifest.icons.find(x=>x.sizes==='192x192');
 const icon512=manifest.icons.find(x=>x.sizes==='512x512');
 assert.ok(icon192,'must include real 192 PNG');
 assert.ok(icon512,'must include real 512 PNG');
 for(const icon of [icon192,icon512]){
  assert.equal(icon.type,'image/png');
  assert.ok(fs.existsSync(path.join(root,icon.src.slice(1))),icon.src);
 }
 const png=fs.readFileSync(path.join(root,icon192.src.slice(1)));
 assert.equal(png.subarray(1,4).toString('ascii'),'PNG');
 assert.equal(png.readUInt32BE(16),192);
 assert.equal(png.readUInt32BE(20),192);
 assert.ok(manifest.icons.some(x=>x.type==='image/svg+xml'&&x.purpose.includes('maskable')));
});

test('original public and Portal V2 share install identity without exposing private data offline',()=>{
 assert.doesNotThrow(()=>new Function(common));
 assert.doesNotThrow(()=>new Function(sw));
 assert.match(common,/beforeinstallprompt/);
 assert.match(common,/appinstalled/);
 assert.match(common,/navigator\.serviceWorker\.register\('\/portal-v2\/bg-app-sw\.js',\{scope:'\/portal-v2\/'\}\)/);
 assert.match(common,/var isPortal=location\.pathname/);
 assert.match(common,/if\(isPortal\|\|document\.querySelector\('\[data-bg-app-public-dock\]'\)/);
 assert.match(common,/link\.href=origin\+item\[0\]/);
 for(const path of ['/','/frisse-blik','/prijzen','/portal-v2/'])assert.ok(common.includes("'"+path+"'"));
 assert.doesNotMatch(common,/fetch\(|localStorage|sessionStorage|indexedDB|caches\.open|setInterval|new Worker\(/);
 assert.match(sw,/request\.mode!=='navigate'/);
 assert.match(sw,/fetch\(request\)\.catch/);
 assert.match(sw,/Cache-Control':'no-store'/);
 assert.doesNotMatch(sw,/\bcaches\.|indexedDB|addEventListener\('sync'|addEventListener\('push'/);
 assert.match(sw,/geen vertrouwelijke bedrijfsgegevens/);
});

test('mobile and tablet have app feedback and canonical original nav (not two portals)',()=>{
 const portal=read('portal-v2/index.html');
 const app=read('portal-v2/app.js');
 assert.match(portal, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/app\.webmanifest"/);
 assert.match(portal, /name="apple-mobile-web-app-capable"/);
 assert.match(portal,/app-device-shell\.css\?v=20261112/);
 assert.match(portal,/bg-app-experience\.js\?v=20261112/);
 assert.match(app,/mountMobilePrimaryNavigation\(\)/);
 assert.match(portalDevice, /@media\(min-width:761px\) and \(max-width:1180px\)/);
 assert.match(portalDevice,/portal-mobile-primary/);
 assert.match(portalDevice,/\.portal-hamburger\{display:none!important\}/);
 assert.match(portalDevice,/safe-area-inset-bottom/);
 assert.match(portalDevice,/font-size:16px!important/);
 assert.match(portalDevice,/prefers-reduced-motion/);
 assert.match(styles,/bg-app-public-dock-link:focus-visible/);
 assert.match(styles,/bg-site-mobile-menu-open/);
 assert.match(styles,/bg-app-install-action/);
 assert.doesNotMatch(styles,/\bposition:\s*absolute\s*!important/);
});

test('original public builder injects one shared app shell per public page and never into private portal',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bg-original-app-shell-'));
 const inject=path.join(root,'tools/site-shell/apply-cms-runtime.mjs');
 const write=(rel,body)=>{
  const target=path.join(tmp,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);
 };
 try{
  write('site/.keep','');
  write('assets/sitewide-mobile-ui-20261111.css',read('assets/sitewide-mobile-ui-20261111.css'));
  write('assets/sitewide-mobile-ui-20261111.js',read('assets/sitewide-mobile-ui-20261111.js'));
  const html='<!doctype html><html lang="nl"><head><title>Test</title></head><body><main>Een pagina</main></body></html>';
  for(const p of ['index.html','pages/contact.html','kennis/index.html','portal/index.html'])write(p,html);
  for(let i=0;i<2;i++){
   const result=spawnSync(process.execPath,[inject],{cwd:tmp,encoding:'utf8'});
   assert.equal(result.status,0,result.stderr);
  }
  for(const p of ['index.html','pages/contact.html','kennis/index.html']){
   const content=fs.readFileSync(path.join(tmp,p),'utf8');
   for(const needle of ['data-bg-app-manifest="1"','id="bg-app-experience-20261112"','data-bg-app-experience="1"','name="apple-mobile-web-app-capable"']){
    assert.equal(content.split(needle).length-1,1,p+' '+needle);
   }
   assert.match(content,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/app\.webmanifest"/);
  }
  const portal=fs.readFileSync(path.join(tmp,'portal/index.html'),'utf8');
  assert.doesNotMatch(portal,/data-bg-app-manifest|bg-app-experience-20261112|bg-app-experience\.js/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
