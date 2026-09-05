import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreGrowthWindow } from '../tools/seo-growth/score.mjs';
import { proposeOpportunities } from '../tools/seo-growth/opportunities.mjs';
import { attachOutcome } from '../tools/seo-growth/outcome-attribution.mjs';
import { validateOptimizationCandidate, mayAutoPublish } from '../tools/seo-growth/optimization-contract.mjs';

test('growth score weights downstream business outcomes and reports confidence',()=>{const weak=scoreGrowthWindow({impressions:1000,clicks:100,engaged_views:80,cta_clicks:10,leads:0});const strong=scoreGrowthWindow({impressions:600,clicks:70,engaged_views:60,cta_clicks:20,leads:8,orders:3,revenue:12000});assert.ok(strong.score>weak.score);assert.ok(strong.confidence>=weak.confidence);});
test('traffic alone does not create a winner but low CTR creates bounded opportunity',()=>{const ops=proposeOpportunities({canonical:'https://www.bedrijfsgeheugen.nl/prijzen',impressions:5000,clicks:40,engaged_views:30,cta_clicks:3},{pages:[]});assert.equal(ops[0].type,'serp-ctr');assert.ok(ops[0].allowed_actions.includes('title-meta'));});
test('outcome attribution does not infer missing revenue or unknown orders',()=>{const r=attachOutcome([{event_id:'p',event_type:'page_view',attribution_root:'x'},{event_id:'c',event_type:'primary_cta_click',attribution_root:'x'}],{event_id:'l',event_type:'lead_outcome',attribution_root:'x'});assert.equal(r.lead_observed,true);assert.equal(r.order_observed,false);assert.equal(r.revenue,null);assert.ok(r.confidence<1);});
test('optimization auto-publish is bounded and evidence-safe',()=>{const good={action:'title-meta',canonical:'https://www.bedrijfsgeheugen.nl/prijzen',hypothesis:'CTR verhogen',target_metric:'organic CTR',rollback_condition:'CTR daalt 10%',evidence_refs:['search-window-1'],auto_publish:true,introduces_new_factual_claim:false,evidence_safe:true,proposed_change:'Duidelijkere title'};assert.deepEqual(validateOptimizationCandidate(good),[]);assert.equal(mayAutoPublish(good),true);assert.ok(validateOptimizationCandidate({...good,proposed_change:'Wij zijn marktleider',explicit_fact_evidence:false}).length>0);});
