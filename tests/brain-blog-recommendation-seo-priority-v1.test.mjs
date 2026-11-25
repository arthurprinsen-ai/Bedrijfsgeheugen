import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
const start=source.indexOf('const DEVELOPER_INTENT=');
const end=source.indexOf('function personalFinalCopyValid');
assert.ok(start>0&&end>start,'selection block not found');
const block=source.slice(start,end)
  .replace(/:\s*(any|string)\[\]\s*=\s*\[\]/g,'=[]')
  .replace(/:\s*(any|string)\[\]/g,'')
  .replace(/:\s*(any|string)\b/g,'');
const ctx={clean:v=>String(v??'').trim(),num:v=>Number.isFinite(Number(v))?Number(v):0,
  classifyCurrentSource:()=>({ok:true}),PERSONAL_CONTRACT:'personal-contract',Set,Array,String,Number,Math,RegExp};
vm.createContext(ctx);
vm.runInContext(block+';this.pick=pickRecommendation;this.eligible=recommendationEligible;',ctx);

const news={recommendation_id:'news',recommendation_type:'source_backed_problem_search_intent',target_channel:'blog',priority:100,status:'suggested',topic_key:'circular-plastics',evidence:{source_backed:true,commercial_value:100}};
const gap=(id,keyword,volume)=>({recommendation_id:id,recommendation_type:'seo_first_mover_intent_gap',target_channel:'blog',priority:70,status:'suggested',topic_key:keyword,evidence:{keyword,search_volume:volume}});

test('historical replay: a keyword-driven blog brief beats a news-backed one when both are eligible',()=>{
  const picked=ctx.pick([news,gap('g1','twinfield boekhouden',390)],'blog');
  assert.equal(picked.recommendation_id,'g1');
});

test('shadow: developer-intent keywords are not eligible for the daily blog, news stays the fallback',()=>{
  assert.equal(ctx.eligible(gap('g2','twinfield api',140),'blog'),false);
  assert.equal(ctx.pick([news,gap('g2','twinfield api',140)],'blog').recommendation_id,'news');
});

test('canary: linkedin_company keeps preferring source-backed items; higher volume wins between keyword briefs',()=>{
  const li={...news,recommendation_id:'li',target_channel:'linkedin_company'};
  const other={recommendation_id:'o',recommendation_type:'commercial_reinforcement',target_channel:'linkedin_company',priority:100,status:'suggested',topic_key:'linkedin',evidence:{}};
  assert.equal(ctx.pick([other,li],'linkedin_company').recommendation_id,'li');
  assert.equal(ctx.pick([gap('a','kennisborging',50),gap('b','bedrijfsprocessen automatiseren',480)],'blog').recommendation_id,'b');
});
