import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLegacyFinanceModels } from '../legacy-finance-models.js';

test('legacy solvency stays equity divided by balance total',()=>{
 const r=calculateLegacyFinanceModels({portal:{valueFinance:{equity:300,balance:1000},metrics:{}}});
 assert.equal(r.solvency,30);
});

test('working-capital model preserves DSO and enriches full cash conversion cycle',()=>{
 const minimum=calculateLegacyFinanceModels({portal:{metrics:{dso:42}}});
 assert.equal(minimum['working-capital-days'],42);
 assert.equal(minimum['working-capital-evidence'].complete,false);
 const full=calculateLegacyFinanceModels({portal:{metrics:{dso:42,inventoryDays:18,creditorDays:25}}});
 assert.equal(full['working-capital-days'],35);
 assert.equal(full['working-capital-evidence'].complete,true);
});
