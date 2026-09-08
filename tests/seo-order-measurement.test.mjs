import test from 'node:test';
import assert from 'node:assert/strict';
import { injectGrowthMeasurement, hasGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';

test('growth measurement is idempotent and contains non-blocking event delivery',()=>{const base='<html><body data-bg-page-role="money"><main><a href="https://www.bedrijfsgeheugen.nl/frisse-blik" data-bg-conversion="frisse-blik">Plan</a></main></body></html>';const out=injectGrowthMeasurement(base,{canonical:'https://www.bedrijfsgeheugen.nl/prijzen',page_role:'money',funnel_stage:'decide',intent:'kosten digitalisering mkb',keyword_cluster:'kosten digitalisering mkb'});assert.ok(hasGrowthMeasurement(out));assert.match(out,/navigator\.sendBeacon/);assert.match(out,/keepalive:true/);assert.match(out,/page_view/);assert.match(out,/organic_landing/);assert.match(out,/engaged_view/);assert.match(out,/primary_cta_click/);assert.match(out,/\/api\/growth-event/);assert.equal(injectGrowthMeasurement(out,{}),out);});
