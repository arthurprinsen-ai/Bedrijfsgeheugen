import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const base='pw-mo14-1/zaalplanner/';
test('mobile app keeps existing lineup and export controls intact',()=>{
 const html=readFileSync(base+'index.html','utf8');
 for(const id of ['match','keeper','roster','pitchPlayers','bench','upcoming','timeline','minutes','pdfGame','pdfSummary','pngBlock','pngSummary','pdfAll']){
   assert.match(html,new RegExp('id="'+id+'"'),'missing '+id);
 }
 for(const screen of ['plan','team','stats','export'])assert.ok(html.includes('data-view-panel="'+screen+'"'));
 assert.match(html,/function rotationsFor/);
 assert.match(html,/function bestAssignment/);
 assert.match(html,/function createPdf/);
 assert.match(html,/beforeinstallprompt/);
 assert.match(html,/serviceWorker\.register/);
});
test('standalone app declares scoped offline resources and actual icons',()=>{
 const m=JSON.parse(readFileSync(base+'manifest.webmanifest','utf8'));
 assert.equal(m.display,'standalone');
 assert.equal(m.scope,'./');
 assert.equal(m.start_url,'./');
 for(const icon of m.icons){
   const name=icon.src.replace(/^\.\//,'');
   const data=readFileSync(base+name);
   assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.ok(data.length>1000);
 }
 const sw=readFileSync(base+'sw.js','utf8');
 assert.match(sw,/mo14-unified-coach-v10-zaal-veld/);
 assert.match(sw,/self\.registration\.scope/);
 assert.doesNotMatch(sw,/make\.com|buffer\.com/);
});

test('native menu items are navigational and backed by real panels',()=>{
 const html=readFileSync(base+'index.html','utf8');
 for(const id of ['home','plan','field','team','stats','more','export','settings']) assert.match(html,new RegExp('data-view-panel="'+id+'"'));
 for(const id of ['home','plan','field','stats','more']) assert.match(html,new RegExp('data-view="'+id+'"'));
 assert.match(html,/data-go="team"/); // Team selection stays accessible from the same app menu.
 for(const id of ['openAppMenu','closeAppMenu','appDrawer','homeRounds','homeNextText']) assert.match(html,new RegExp('id="'+id+'"'));
 for(const label of ['Downloads','Instellingen','Zet op beginscherm']) assert.ok(html.includes(label));
 assert.match(html,/function renderHomeHub/);
 assert.ok(html.includes('function showView(next, scrollTop=true, addHistory=true)'));
 assert.ok(html.includes('history.pushState'));
 assert.ok(html.includes("addEventListener('popstate'"));
 assert.match(html,/data-go="settings"/);
 const m=JSON.parse(readFileSync(base+'manifest.webmanifest','utf8'));
 assert.ok(m.shortcuts?.length>=3,'real home-screen shortcuts are required');
});

test('PW Enschede branding and independent editable match dates share the existing planner state',()=>{
 const html=readFileSync(base+'index.html','utf8');
 const m=JSON.parse(readFileSync(base+'manifest.webmanifest','utf8'));
 assert.equal(m.theme_color,'#59222d');
 assert.ok(html.includes('Clublogo PW Hockey Enschede'));
 assert.ok(html.includes('src="./pw-logo.png"'));
 assert.ok(html.includes('PW HOCKEY ENSCHEDE'));
 for(const id of ['matchDate','matchDateLabel','homeGameDate','homeRounds'])assert.ok(html.includes('id="'+id+'"'));
 for(const marker of ['data-fixture-field="date"','data-fixture-field="time"','data-fixture-field="opponent"','data-fixture-field="home"','function formatMatchDate(i)','function canvasMatchDate(i)','function formatKickoff(i)']){
   assert.ok(html.includes(marker),'missing date binding: '+marker);
 }
 assert.ok(html.includes("new Intl.DateTimeFormat('nl-NL'"));
 assert.ok(html.includes('canvasMatchDate(matchIndex)'));
 const sw=readFileSync(base+'sw.js','utf8');
 assert.ok(sw.includes('./pw-logo.png'));
 assert.match(sw,/mo14-unified-coach-v10-zaal-veld/);
});

test('12 screenshot-grounded PW fixtures across six days have separate time, opponent and keepers',()=>{
 const html=readFileSync(base+'index.html','utf8');
 const begin=html.indexOf('const OFFICIAL_FIXTURES=');
 const end=html.indexOf(';\nconst toMatch=',begin);
 assert.ok(begin>=0,'fixture declaration missing');
 const text=html.slice(begin+'const OFFICIAL_FIXTURES='.length,end);
 const fixtures=JSON.parse(text);
 assert.equal(fixtures.length,12);
 assert.equal(new Set(fixtures.map(x=>x.fixtureId)).size,12);
 const byDay=new Map();
 fixtures.forEach(f=>{byDay.set(f.date,(byDay.get(f.date)||0)+1);assert.match(f.time,/^\d{2}:\d{2}$/)});
 assert.deepEqual([...byDay.entries()],[
  ['2026-12-06',2],['2026-12-13',2],['2026-12-19',2],
  ['2027-01-09',2],['2027-01-24',2],['2027-02-13',2]
 ]);
 assert.deepEqual(fixtures.map(f=>f.time),['12:00','13:40','12:05','12:55','15:20','16:10','11:30','13:10','11:30','12:20','12:00','12:50']);
 assert.deepEqual(fixtures.map(f=>f.opponent),['MO14-2 zaal','Twente MO14-2','Zutphen MO14-1','Twente MO14-2','Haackey MO14-1-mix','Apeldoorn MO14-3','Apeldoorn MO14-2','Apeldoorn MO14-3','Haackey MO14-1-mix','MO14-2 zaal','Apeldoorn MO14-2','Zutphen MO14-1']);
 assert.deepEqual(fixtures.map(f=>f.home),[true,true,true,false,true,false,true,true,false,true,false,false]);
 for(const marker of ['function pdfForDay','id="pdfDay"','data-day-pdf','id="addFixture"','id="copyPresenceDay"','function fixtureTitle','function formatKickoff','data-fixture-index'])
  assert.ok(html.includes(marker),'missing real matchday experience: '+marker);
 const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>',html.indexOf('<script>')));
 assert.doesNotThrow(()=>new Function(script),'complete client JavaScript must parse in Node');
});
