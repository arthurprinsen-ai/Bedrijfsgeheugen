import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../tools/site-shell/apply-commercial-pricing-v1.mjs',import.meta.url),'utf8');

function run(size='pro',goal='automatiseren',mode='samen'){
 const script=code.match(/id="pkgGo"[^<]*>[^<]*<\/a><\/div><script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,'Original pricing package finder script is present');
 const changes={};
 const link={href:'',addEventListener(){}};
 const fields={pkgGo:link,pkgSize:{value:size},pkgGoal:{value:goal},pkgMode:{value:mode}};
 for(const [id,node] of Object.entries(fields)){
  if(id==='pkgGo')continue;
  node.addEventListener=(event,fn)=>{changes[id+':'+event]=fn;};
 }
 const document={getElementById:id=>fields[id]||null};
 vm.runInNewContext(script,{document,URLSearchParams},{timeout:3000});
 return {link,fields,changes};
}

test('historical: one original pricing CTA is tracked as an intent, never checkout or order',()=>{
 assert.match(code,/id="pkgGo"[^>]*data-bg-conversion="pakketadvies"/);
 assert.match(code,/id="pkgGo"[^>]*data-bg-funnel-stage="consider"/);
 assert.match(code,/href="\/pakketadvies"/);
 assert.doesNotMatch(code,/data-bg-conversion="paid_order"/);
 const c=run();
 assert.equal(c.link.href,'/pakketadvies?size=pro&goal=automatiseren&mode=samen');
});

test('shadow: every selected pricing field updates the single native URL before navigation',()=>{
 const c=run();
 c.fields.pkgSize.value='groei';
 c.changes['pkgSize:change']();
 assert.match(c.link.href,/size=groei/);
 c.fields.pkgGoal.value='governance';
 c.changes['pkgGoal:change']();
 assert.match(c.link.href,/goal=governance/);
 c.fields.pkgMode.value='begeleid';
 c.changes['pkgMode:change']();
 assert.equal(c.link.href,'/pakketadvies?size=groei&goal=governance&mode=begeleid');
});

test('canary: original native link handles enter/keyboard without duplicate JS navigation or PII fields',()=>{
 const c=run('starter','inzicht','zelf');
 assert.equal(c.link.href,'/pakketadvies?size=starter&goal=inzicht&mode=zelf');
 assert.doesNotMatch(code,/location\.href='\/pakketadvies/);
 assert.doesNotMatch(code,/window\.open\('\/pakketadvies/);
 const block=code.match(/id="pkgGo"[\s\S]*?<\/script>/)?.[0]||'';
 assert.doesNotMatch(block,/fetch\(|sendBeacon|setInterval|email|phone|consent\s*=|provider/i);
 assert.match(block,/syncPackageAdvice/);
});
