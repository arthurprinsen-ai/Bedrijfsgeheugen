import test from 'node:test';
import assert from 'node:assert/strict';
import {managementAccountingMarkup} from './management-accounting-intelligence.js';

test('renders value driver graph, benchmark evidence and roadmap levers from customer data',()=>{
 const html=managementAccountingMarkup({portal:{
  profile:{employees:10},
  metrics:{revenue:1000000,grossMargin:40,ebitda:120000,wages:400000,dso:55,performance:{billable:72}},
  people:{absence:6,turnover:12},
  valueFinance:{debt:300000,cash:50000,multiple:5},
  market:{benchmarks:[
   {metric:'Omzet per medewerker',benchmark:120000,source:'Sector 2026'},
   {metric:'DSO',benchmark:35,source:'Sector 2026'},
   {metric:'Verzuim',benchmark:4,source:'Sector 2026'}
  ]}
 }});
 assert.match(html,/Van medewerker en proces naar cash en bedrijfswaarde/);
 assert.match(html,/Powerhouse-hefbomen|Grootste hefbomen/);
 assert.match(html,/Sector 2026/);
 assert.match(html,/effort/i);
 assert.match(html,/Evidence-first/);
});

test('renders explicit data-gap guidance instead of fictional benchmarks',()=>{
 const html=managementAccountingMarkup({portal:{profile:{employees:10},metrics:{revenue:100000}}});
 assert.match(html,/Nog nodig voor een rijker beeld/);
 assert.doesNotMatch(html,/benchmark 0/);
});
