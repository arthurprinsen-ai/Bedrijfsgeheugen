#!/usr/bin/env node
// Source freshness is a claim-level evidence problem, never a timestamp-reset operation.
// This observer reads the canonical catalog without modifying it.
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const now=new Date();
const days=(date)=>{const d=new Date(String(date||'')+'T00:00:00Z');return Number.isFinite(d.getTime())?Math.floor((now-d)/86400000):Infinity;};
const rows=catalog.models.map(m=>{
 const evidence=m.verification_evidence||{};
 const audit=m.supplier_audit||{};
 const age=days(evidence.checked_on||m.verified_at);
 const eligible=m.auto_recommendation_eligible===true||audit.automatic_recommendation_eligible===true;
 const classification= !Number.isFinite(age)||age<0?'INVALID_DATE':age>14?'STALE':age>=10?'EXPIRING':'CURRENT';
 return {id:m.id,provider:m.provider,age,classification,eligible,source:m.source,
  proofDate:evidence.checked_on||null,unverified:evidence.not_verified||[]};
});
const stale=rows.filter(r=>r.classification==='STALE'||r.classification==='INVALID_DATE');
const expiring=rows.filter(r=>r.classification==='EXPIRING');
const autoStale=stale.filter(r=>r.eligible);
const report=[
 '# AI model evidence freshness',
 '',
 'Generated: '+now.toISOString(),
 'Catalog entries: '+rows.length,
 'Stale/invalid: '+stale.length,
 'Expiring (10–14 days): '+expiring.length,
 'Stale automatically eligible: '+autoStale.length,
 '',
 '| Model | Provider | Age in days | State | Auto-eligible | Official source |',
 '|---|---|---:|---|---|---|',
 ...rows.filter(r=>r.classification!=='CURRENT').map(r=>
 '| '+r.id+' | '+r.provider+' | '+(Number.isFinite(r.age)?r.age:'unknown')+' | '+r.classification+' | '+r.eligible+' | '+(r.source||'unknown')+' |'),
 '',
 'Action: independently verify the model-specific claims against supplier evidence, update only verified claims and their dates, and preserve unknown privacy/EU residency as unknown.',
 'This observer does not change source evidence, approval or release policy.'
].join('\n');
console.log(report);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report+'\n');
if(expiring.length)console.log('::warning::'+expiring.length+' model records will expire within five days under the 14-day rule.');
if(stale.length)console.log('::warning::'+stale.length+' model evidence records are stale or invalid; source re-verification required.');
if(autoStale.length){console.error('::error::'+autoStale.length+' auto-eligible model records have stale source evidence.');process.exitCode=1;}
