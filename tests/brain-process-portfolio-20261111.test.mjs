import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('original portal process slice does not add a parallel scheduler, database or checkout',()=>{
 const source=readFileSync(new URL('../portal-v2/modules/process-portfolio.js',import.meta.url),'utf8');
 const view=readFileSync(new URL('../portal-v2/modules/process-portfolio-view.js',import.meta.url),'utf8');
 const board=readFileSync(new URL('../portal-v2/modules/delivery-board.js',import.meta.url),'utf8');
 const site=readFileSync(new URL('../tools/ci/netlify-build-entry.mjs',import.meta.url),'utf8');
 assert.match(source,/nextConsumerReceipt:'EVIDENCE_DUE'/);
 assert.match(source,/evidenceVerified:false/);
 assert.match(source,/AUTHORIZED_APPROVAL_RECEIPT_REQUIRED/);
 assert.match(view,/processPortfolioOverview/);
 assert.match(board,/domainState\.flush/);
 assert.match(site,/business-os-positioning/);
 for(const text of [source,view])assert.doesNotMatch(text,/service_role|new Scheduler|setInterval|cron\.schedule|fetch\(|localStorage|sessionStorage|create\s+table/);
});
