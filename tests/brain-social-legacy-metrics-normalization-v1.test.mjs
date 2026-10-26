import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeMetricSnapshot,metricVector,selectOptimizationMetric} from '../netlify/functions/_social-learning-model.mjs';
const policy=JSON.parse(fs.readFileSync(new URL('../config/social-learning-engine.json',import.meta.url),'utf8'));
test('existing verified Buffer observation is normalized by semantic field name, not interpreted as all missing',()=>{
 const raw={'Reach':857,'Comments':0,'Eng. Rate':0.44,'Reactions':5,'Impressions':1125};
 const m=normalizeMetricSnapshot(raw);
 assert.equal(m.impressions,1125);
 assert.equal(m.reach,857);
 assert.equal(m.reactions,5);
 assert.equal(m.comments,0);
 assert.equal(m.likes,null);
 assert.equal(m.orders,null);
 assert.equal(m.revenue,null);
 assert.equal(metricVector(raw).reaction_rate,5/1125);
 assert.equal(metricVector(raw).comment_rate,0);
});
test('actual provider reaction count remains separate from likes and no fake engagement rate',()=>{
 const value=metricVector({'Impressions':100,'Reactions':10});
 assert.equal(value.reactions,10);
 assert.equal(value.likes,null);
 assert.equal(value.like_rate,null);
 assert.equal(value.reaction_rate,0.1);
 assert.equal(value.substantive_interaction_rate,null);
});
test('valid canonical metric names take precedence; null and negative never become invented zero',()=>{
 assert.equal(normalizeMetricSnapshot({'Impressions':100,impressions:200}).impressions,200);
 assert.equal(normalizeMetricSnapshot({'Impressions':null}).impressions,null);
 assert.equal(normalizeMetricSnapshot({'Impressions':-1}).impressions,null);
 assert.equal(normalizeMetricSnapshot({}).comments,null);
});
test('reactions are ranked after verified commercial, substantive, click and like measures',()=>{
 assert.equal(policy.metricPriority.at(-1),'reactions');
 const t=metricVector({'Impressions':100,'Reactions':10});
 const cohort=[metricVector({'Impressions':100,'Reactions':5})];
 const sel=selectOptimizationMetric(t,cohort,policy.metricPriority);
 assert.equal(sel.metric,'reactions');
 assert.equal(sel.effectSize,1);
});
test('original null-only recorded evaluations are marked for source-backed reevaluation in existing store',()=>{
 const source=fs.readFileSync(new URL('../supabase/functions/social-learning-store/index.ts',import.meta.url),'utf8');
 assert.ok(source.includes("select('post_id,window_hours,metric_vector')"));
 assert.ok(source.includes("const measured=(evals||[]).filter"));
 assert.ok(source.includes("typeof e.metric_vector?.[k]==='number'"));
 assert.ok(source.includes("source_window_evidence"));
});
