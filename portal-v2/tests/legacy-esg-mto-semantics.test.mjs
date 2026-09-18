import test from 'node:test';
import assert from 'node:assert/strict';
import { functionalSchema, LEGACY_ESG_ITEMS, LEGACY_ESG_STATUS, LEGACY_POLICY_NAMES } from '../modules/functional-suite.js';
import { calculateLegacyEquivalent } from '../legacy-parity-engine.js';

test('compliance workspace preserves all 11 legacy ESG subjects in exact order',()=>{
  assert.deepEqual(LEGACY_ESG_ITEMS.map(x=>x.key),['energie','co2','afval','water','vervoer','arbo','divers','opleiding','keten','ethiek','bestuur']);
  assert.deepEqual(LEGACY_ESG_ITEMS.map(x=>x.label),[
    'Energieverbruik','CO₂-uitstoot','Afval en grondstoffen','Waterverbruik','Vervoer en wagenpark',
    'Arbeidsomstandigheden','Diversiteit en gelijke beloning','Opleiding en ontwikkeling','Arbeid in de keten',
    'Bedrijfsethiek en anticorruptie','Bestuur en verantwoordelijkheid'
  ]);
  const fields=functionalSchema('compliance-governance').filter(x=>String(x.legacyFieldId).startsWith('esgVelden:'));
  assert.equal(fields.length,11);
  assert.ok(fields.every(x=>x.type==='select'));
});

test('legacy ESG statuses remain the original 0-to-3 meanings',()=>{
  assert.deepEqual(LEGACY_ESG_STATUS,[
    {value:'0',label:'Niet beschikbaar'},
    {value:'1',label:'Met de hand bij elkaar gezocht'},
    {value:'2',label:'Deels uit een systeem'},
    {value:'3',label:'Komt vanzelf uit de administratie'}
  ]);
  const fields=functionalSchema('compliance-governance').filter(x=>String(x.legacyFieldId).startsWith('esgVelden:'));
  assert.ok(fields.every(x=>JSON.stringify(x.options)===JSON.stringify(LEGACY_ESG_STATUS)));
});

test('legacy ESG readiness maps 0..3 to 0..5 without inventing missing data',()=>{
  assert.equal(calculateLegacyEquivalent('esg-readiness',{portal:{compliance:{esg:Array(11).fill(0)}}}),0);
  assert.equal(calculateLegacyEquivalent('esg-readiness',{portal:{compliance:{esg:Array(11).fill(3)}}}),5);
  assert.equal(calculateLegacyEquivalent('esg-readiness',{portal:{compliance:{esg:Array(11).fill(1)}}}),5/3);
});

test('policy labels preserve the twelve original legacy documents',()=>{
  assert.deepEqual(LEGACY_POLICY_NAMES,[
    'Informatiebeveiligingsbeleid','Toegangsbeleid en rechten','Incident-responseplan','Back-up en herstel — getest',
    'Verwerkingsregister en bewaartermijnen','Verwerkersovereenkomsten','AI-gebruiksbeleid','Datadefinities en eigenaren (BI)',
    'Rapportagekalender','Leveranciers- en ketenafspraken','Duurzaamheidsgegevens (CSRD)','Uitwijk en continuïteit'
  ]);
});

test('MTO keeps all four original answer values',()=>{
  const field=functionalSchema('mensen').find(x=>x.legacyFieldId==='mMto');
  assert.deepEqual(field.options,[
    {value:'0',label:'nooit gedaan'},
    {value:'1',label:'langer dan 2 jaar geleden'},
    {value:'2',label:'binnen 2 jaar'},
    {value:'3',label:'jaarlijks, met opvolging'}
  ]);
});
