import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pricing=await readFile(new URL('../prijzen.html',import.meta.url),'utf8');
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const sources={
 nav:await read('portal-v2/navigation-model.js'),
 trust:await read('portal-v2/trusted-advisor-assurance.js'),
 impact:await read('portal-v2/operating-system/impact-engine.js'),
 ladder:await read('portal-v2/execution-ladder-catalog.js'),
 decisions:await read('portal-v2/company-decisions.js'),
 resource:await read('portal-v2/resource-analytics.js'),
 foresight:await read('portal-v2/foresight-intelligence.js'),
 lifecycle:await read('portal-v2/lifecycle-context.js'),
 entitlements:await read('platform/saas/entitlement-policy.mjs')
};
const has=(text,term)=>text.toLowerCase().includes(term.toLowerCase());

test('pricing exposes the full Portal V2 capability contract',()=>{
 for(const term of ['Executive Cockpit','directievragen','Strategy DNA','BCG','Execution Ladder','Impact Engine','scenarioanalyse','forecasting','foresight','Trusted Advisor assurance','AI Capability Model','human-in-the-loop','control-plane','Compliance & regelgeving','AI Act','AVG/GDPR','NIS2/Cyberbeveiligingswet','CSRD','Resource & Sustainability Intelligence','tokens','credits','CO₂e','water','Lifecycle, M&A & portfolio']) assert.equal(has(pricing,term),true,term);
});

test('pricing capability claims remain grounded in canonical portal sources',()=>{
 assert.equal(/audit|koppelingen|documenten|actieve-acties/i.test(sources.nav),true);
 assert.equal(/Geverifieerd|Brongebonden|Onvoldoende bewijs/i.test(sources.trust),true);
 assert.equal(/IMPACT_FORMULA_VERSION|payback_months|compliance_impact/i.test(sources.impact),true);
 assert.equal(/Tellen[\s\S]*Vastleggen[\s\S]*Koppelen[\s\S]*Meten[\s\S]*Borgen/.test(sources.ladder),true);
 assert.equal(/selectTopPriorities|selectApprovalNeeded|selectValueLeakage/.test(sources.decisions),true);
 assert.equal(/CO₂e|Water|Energie|Tokens|Credits|Requests/.test(sources.resource),true);
 assert.equal(/forecast|benchmark|uncertainty|recommended_actions/i.test(sources.foresight),true);
 assert.equal(/phase|event|goal|grow|loss|crisis/i.test(sources.lifecycle),true);
 assert.equal(/control|scale|enterprise|refresh|data_sources/i.test(sources.entitlements),true);
});

test('pricing states the anti-drift contract explicitly',()=>{
 assert.equal(has(pricing,'capability die in de canonieke Portal V2-bronnen als klantfunctionaliteit bestaat'),true);
 assert.equal(has(pricing,'beloven we hier geen functionaliteit die niet in Portal V2 of de SaaS-entitlementlaag aantoonbaar bestaat'),true);
});
