import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {injectGrowthMeasurement} from '../tools/seo-order-engine/measurement.mjs';
import {normalizeBehaviorEvent} from '../tools/seo-growth/normalize-observation.mjs';
import {normalizeGrowthEventForDataHub} from '../tools/seo-growth/datahub-contract.mjs';
import {projectAcquisitionCtaSource} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const staticJs=readFileSync('assets/meting.js','utf8');
const html=injectGrowthMeasurement('<html><body><main><a data-bg-conversion="zelfscan" href="/zelfscan">Start</a></main></body></html>',{
 canonical:'https://www.bedrijfsgeheugen.nl/prijzen',page_role:'money',funnel_stage:'decide'
});
const inline=html.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/)?.[1];
test('both original trackers remain syntactically valid, exclusive and share only one tab root',()=>{
 assert.ok(inline);
 assert.doesNotThrow(()=>new vm.Script(inline));
 assert.doesNotThrow(()=>new vm.Script(staticJs));
 for(const src of [inline,staticJs]){
  assert.match(src,/sessionStorage.getItem\('bg_meting_sessie'\)\|\|sessionStorage.getItem\('bg_growth_session'\)/);
  assert.match(src,/sessionStorage.setItem\('bg_meting_sessie',sid\)/);
  assert.match(src,/sessionStorage.setItem\('bg_growth_session',sid\)/);
  assert.match(src,/function bronCategorie\(\)/);
  assert.match(src,/bg_consent/);
 }
 assert.match(staticJs,/getElementById\('bg-growth-measurement'\)/);
 assert.match(staticJs,/attribution_root:sid,channel:'website'/);
 assert.match(inline,/attribution_root:sid/);
});
function staticCategory(herkomst,allowed){
 const s=staticJs.slice(staticJs.indexOf('  function bronCategorie(){'),staticJs.indexOf('  /* Commerciële meetpunten'));
 return vm.runInNewContext('var herkomst='+JSON.stringify(herkomst)+';function toestemming(){return '+JSON.stringify(allowed)+';}'+s+';bronCategorie();',{});
}
test('strict first-touch categories distinguish linkedin personal/company, Instagram, email and organic, no raw campaign leakage',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(staticCategory('linkedin / social / linkedin-personal',true))),{source:'linkedin',medium:'social',campaign:'linkedin_personal'});
 assert.deepEqual(JSON.parse(JSON.stringify(staticCategory('linkedin / social / linkedin-company',true))),{source:'linkedin',medium:'social',campaign:'linkedin_company'});
 assert.deepEqual(JSON.parse(JSON.stringify(staticCategory('instagram / social / miratalks',true))),{source:'instagram',medium:'social',campaign:'instagram'});
 assert.deepEqual(JSON.parse(JSON.stringify(staticCategory('email / newsletter / private-name-at-example.com',true))),{source:'email',medium:'email',campaign:'email'});
 assert.deepEqual(JSON.parse(JSON.stringify(staticCategory('www.bing.com',true))),{source:'bing',medium:'organic',campaign:''});
 assert.deepEqual(JSON.parse(JSON.stringify(staticCategory('google / cpc',true))),{source:'google',medium:'paid',campaign:''});
 assert.deepEqual(JSON.parse(JSON.stringify(staticCategory('any.private-domain.example',true))),{source:'referral',medium:'referral',campaign:''});
 assert.deepEqual(JSON.parse(JSON.stringify(staticCategory('linkedin / social / linkedin-company',false))),{source:'website',medium:'unattributed',campaign:''});
});
function runInline(allowed){
 const listeners={};const seen=[],map=new Map();let n=0;
 const storage={getItem:key=>map.get(key)||null,setItem:(key,val)=>map.set(key,String(val))};
 const location={origin:'https://www.bedrijfsgeheugen.nl',hostname:'www.bedrijfsgeheugen.nl',
  pathname:'/prijzen',search:'?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-personal',
  href:'https://www.bedrijfsgeheugen.nl/prijzen?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin-personal'};
 const w={location,__bgGrowthMeasurement:false,scrollY:0,addEventListener:()=>{}};
 const doc={referrer:'',visibilityState:'visible',body:{getAttribute:()=>''},
  querySelector:()=>null,addEventListener:(name,fn)=>{listeners[name]=fn;},
  documentElement:{scrollHeight:2200,clientHeight:1000}};
 const crypto={randomUUID:()=>`00000000-0000-4000-8000-${String(++n).padStart(12,'0')}`};
 const c={window:w,document:doc,navigator:{webdriver:false,sendBeacon:()=>false},
  location,sessionStorage:storage,localStorage:{getItem:key=>key==='bg_consent'&&allowed?'granted':null},
  crypto,URL,URLSearchParams,Blob,Date,Math,fetch:(_url,opts)=>{seen.push(JSON.parse(opts.body));return Promise.resolve({ok:true});},
  setTimeout:()=>1};
 vm.runInNewContext(inline,c,{timeout:3000});
 const a={href:'https://www.bedrijfsgeheugen.nl/zelfscan',
  getAttribute:key=>key==='data-bg-conversion'?'zelfscan':null,
  closest:()=>({}),hasAttribute:()=>false};
 listeners.click({target:{closest:selector=>selector==='a'?a:null}});
 return {seen,map};
}
test('original inline producer links actual consented CTA to known social source and same tab root',()=>{
 const {seen,map}=runInline(true);
 const click=seen.find(x=>x.event_type==='primary_cta_click');
 assert.ok(click,'original CTA event exists');
 assert.equal(click.source,'linkedin');
 assert.equal(click.medium,'social');
 assert.equal(click.campaign,'linkedin_personal');
 assert.equal(click.channel,undefined);
 assert.equal(click.attribution_root,map.get('bg_meting_sessie'));
 assert.equal(click.attribution_root,map.get('bg_growth_session'));
 assert.ok(seen.some(x=>x.event_type==='selfscan_start'));
 assert.equal(click.canonical,'https://www.bedrijfsgeheugen.nl/prijzen');
 const normalized=normalizeBehaviorEvent(click);
 const datahub=normalizeGrowthEventForDataHub({
  event_id:normalized.event_id,event_type:normalized.event_type,canonical:normalized.canonical,
  source:normalized.source,medium:normalized.medium,campaign:click.campaign,
  attribution_root_key:normalized.attribution_root
 });
 assert.equal(datahub.source,'linkedin');
 assert.equal(datahub.medium,'social');
 assert.equal(datahub.campaign,'linkedin_personal');
 assert.equal(datahub.attribution_root_key,click.attribution_root);
});
test('without analytics permission no marketing/referrer or campaign is supplied',()=>{
 const {seen}=runInline(false);
 assert.ok(seen.length);
 assert.ok(seen.every(r=>r.source==='website'&&r.medium==='unattributed'&&r.campaign===''));
});

test('owner-only acquisition projection dedupes CTA source categories and withholds customer revenue claims',()=>{
 const at='2026-10-30T11:00:00Z',start='2026-10-29T16:00:00Z';
 const sample=[
  {event_id:'a',event_type:'primary_cta_click',source:'linkedin',medium:'social',campaign:'linkedin_personal',occurred_at:start,is_robot:false},
  {event_id:'a',event_type:'primary_cta_click',source:'linkedin',medium:'social',campaign:'linkedin_personal',occurred_at:start,is_robot:false},
  {event_id:'b',event_type:'primary_cta_click',source:'email',medium:'email',campaign:'email',occurred_at:start,is_robot:false},
  {event_id:'c',event_type:'primary_cta_click',source:'website',medium:'unattributed',campaign:'',occurred_at:start,is_robot:false},
  {event_id:'robot',event_type:'primary_cta_click',source:'instagram',occurred_at:start,is_robot:true},
  {event_id:'old',event_type:'primary_cta_click',source:'linkedin',occurred_at:'2026-09-20T00:00:00Z',is_robot:false},
  {event_id:'submit',event_type:'form_submit_intent',source:'instagram',occurred_at:start,is_robot:false}
 ];
 const result=projectAcquisitionCtaSource(sample,{status:'LIVE',at});
 assert.equal(result.status,'RECORDED_SOURCE_CATEGORIES_NOT_PROVIDER_VERIFIED');
 assert.equal(result.observedCtaEvents,3);
 assert.equal(result.byChannel.linkedin_personal,1);
 assert.equal(result.byChannel.email,1);
 assert.equal(result.byChannel.unattributed,1);
 assert.equal(result.byChannel.instagram,0);
 assert.equal(result.providerAttributionVerified,false);
 assert.equal(result.paidOrderAttributionVerified,false);
 assert.equal(result.consentIndependentlyVerified,false);
 assert.equal(projectAcquisitionCtaSource(sample,{status:'TRUNCATED',at}).status,'UNVERIFIED');
 assert.equal(projectAcquisitionCtaSource([],{status:'LIVE',at}).status,'NO_CTA_SOURCE_EVENTS_OBSERVED');
});
test('original owner-only portal binds PII-free acquisition readback after social and growth sources',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const page=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/growth_events/);
 assert.match(api,/event_type=eq\.primary_cta_click&is_robot=eq\.false/);
 assert.match(api,/acquisitionEvents:datasets\[15\]/);
 assert.match(page,/CRO-bronattributie/);
 assert.match(page,/Orders uit social of e-mail pas na daadwerkelijke klant-/);
 assert.doesNotMatch(api,/CREATE TABLE|cron\.schedule/);
});
