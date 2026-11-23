import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEditorialCouncilBrief} from '../supabase/functions/_shared/editorial-council-context.mjs';
import {companyEditorialViolations,companyRecurringFrictionFamily} from '../supabase/functions/_shared/company-linkedin-editorial-contract.mjs';

test('original editorial council instructs source novelty before company post generation',()=>{
 const brief=buildEditorialCouncilBrief({channel:'linkedin_company'});
 assert.match(brief.editorial,/SOURCE NOVELTY BEFORE GENERATION/);
 assert.match(brief.editorial,/COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT/);
 assert.match(brief.editorial,/ANDER ondernemersprobleem/);
 assert.match(brief.editorial,/gedateerde, controleerbare bron/);
 assert.match(brief.editorial,/HOLD/);
 assert.match(brief.editorial,/geen parafrase van offertes/);
 assert.match(brief.instruction,/TRUSTED ADVISOR/);
 assert.equal(brief.next_application_status,'NOT_YET_APPLIED_OR_VERIFIED');
});

test('original publisher/reviewer retains actual semantic repeat protection',()=>{
 const old='Een verloren offerte bleef wekenlang zonder opvolging. Sales wist niet wie moest bellen.';
 const rewritten='Offertes blijven liggen omdat niemand de opvolging beheert. Een verdwenen verkoopkans veroorzaakt verlies.';
 assert.equal(companyRecurringFrictionFamily(old),'missing-or-unfollowed-offer');
 assert.ok(companyEditorialViolations(rewritten,{recentPosts:[old]})
   .some(v=>v.code==='COMPANY_RECENT_OPERATIONAL_FRICTION_REPEAT'));
 const source=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 assert.match(source,/pre.?publish/i);
});

test('council does not turn editorial guidance into provider authorization',()=>{
 const company=buildEditorialCouncilBrief({channel:'linkedin_company'});
 const other=buildEditorialCouncilBrief({channel:'linkedin_personal'});
 assert.equal(company.trust_policy,other.trust_policy);
 assert.ok(!other.editorial.includes('SOURCE NOVELTY BEFORE GENERATION'));
 assert.match(company.truth_boundary,/No fake provider metrics/);
 assert.match(company.truth_boundary,/no second scheduler\/writer/);
});
