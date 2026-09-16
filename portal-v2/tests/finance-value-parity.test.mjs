import test from 'node:test';
import assert from 'node:assert/strict';
import { financeValueMetrics } from '../calculators/finance-value.js';

const state={portal:{
  metrics:{revenue:1000,grossMargin:40,ebitda:150,wages:300,dso:45},
  valueFinance:{debt:300,cash:50,equity:400,balance:800,fixed:350,interest:30,multiple:5,wacc:10}
}};

test('EBITDA multiple yields enterprise and equity value in the same x1000 units as legacy input',()=>{
 const m=financeValueMetrics(state,{branchGrowthPct:2,branchGrossMarginPct:35});
 assert.equal(m.enterpriseValue,750);
 assert.equal(m.equityValue,500);
});

test('DCF perpetuity uses legacy 70% FCF and capped growth semantics',()=>{
 const m=financeValueMetrics(state,{branchGrowthPct:2});
 assert.equal(m.freeCashFlow,105);
 assert.equal(m.dcfValue,1338.75);
});

test('DuPont reproduces legacy EBITDA-derived net margin, turnover and leverage',()=>{
 const m=financeValueMetrics(state);
 assert.equal(m.dupont.netMargin,0.09);
 assert.equal(m.dupont.assetTurnover,1.25);
 assert.equal(m.dupont.leverage,2);
 assert.equal(m.dupont.roePct,22.5);
});

test('Altman Z uses the protected private-company simplified formula',()=>{
 const m=financeValueMetrics(state);
 const expected=0.717*((1000*.15)/800)+0.847*(400*.3/800)+3.107*(150/800)+0.42*(400/300)+0.998*(1000/800);
 assert.ok(Math.abs(m.altmanZ-expected)<1e-12);
});

test('interest coverage/DSCR and net-debt ratio reproduce legacy financing health',()=>{
 const m=financeValueMetrics(state);
 assert.equal(m.interestCoverage,5);
 assert.equal(m.dscr,5);
 assert.equal(m.netDebtToEbitda,250/150);
 assert.equal(m.solvencyPct,50);
});

test('break-even and safety margin use gross margin and fixed costs',()=>{
 const m=financeValueMetrics(state);
 assert.equal(m.breakEvenRevenue,875);
 assert.equal(m.safetyMarginPct,12.5);
});

test('working capital reproduces legacy debtor-days calculation',()=>{
 const m=financeValueMetrics(state);
 assert.ok(Math.abs(m.workingCapitalReceivables-(1000/365*45))<1e-12);
});

test('sensitivity preserves legacy 10k/25k/50k structural savings scenarios',()=>{
 const m=financeValueMetrics(state);
 assert.deepEqual(m.sensitivity,[
   {annualSaving:10000,valueImpact:50000},
   {annualSaving:25000,valueImpact:125000},
   {annualSaving:50000,valueImpact:250000}
 ]);
});

test('branch EBITDA and gross-margin fallbacks apply only when own values are absent',()=>{
 const empty={portal:{metrics:{revenue:1000,dso:30},valueFinance:{debt:100,cash:0,equity:300,balance:700,interest:20,multiple:4,wacc:9}}};
 const m=financeValueMetrics(empty,{branchEbitdaPct:12,branchGrossMarginPct:35,branchGrowthPct:1});
 assert.equal(m.ebitdaUsed,120);
 assert.equal(m.grossMarginPct,35);
 assert.equal(m.enterpriseValue,480);
});

test('DCF fails closed instead of dividing by zero when WACC does not exceed growth',()=>{
 const m=financeValueMetrics(state,{branchGrowthPct:20});
 assert.equal(m.dcfValue,null);
});
