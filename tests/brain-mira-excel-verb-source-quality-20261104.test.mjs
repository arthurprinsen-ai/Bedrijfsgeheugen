import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isSpreadsheetBusinessContext} from '../supabase/functions/_shared/mira-business-spreadsheet-context.mjs';

const radar=readFileSync(new URL('../supabase/functions/powerhouse-mira-problem-radar/index.ts',import.meta.url),'utf8');
test('VASE student artists excel AT an art competition is not Excel spreadsheet business evidence',()=>{
 const title='Drawing Statewide Recognition: CHS and CHS9 Artists Excel at VASE Competition | MOCKINGBIRD ELEMENTARY';
 assert.equal(isSpreadsheetBusinessContext(title),false);
 assert.equal(isSpreadsheetBusinessContext('Students excel at math and art'),false);
 assert.equal(isSpreadsheetBusinessContext('School artists excel in competition'),false);
 assert.equal(isSpreadsheetBusinessContext('Excel at your craft'),false);
});
test('actual spreadsheet business evidence still qualifies, without hiding valid Dutch owners',()=>{
 for(const s of [
  'Ondernemers werken in Excel en missen één waarheid',
  'Facturatie loopt via Excel-bestanden en losse exports',
  'Managementreporting using Excel spreadsheets',
  'De planning staat in een spreadsheet',
  'Excel werkmap verspreid over medewerkers',
  'Financial tracking in XLSX files',
 ]) assert.equal(isSpreadsheetBusinessContext(s),true,s);
});
test('original Mira source classifier and business relevance use one shared precise semantic gate',()=>{
 assert.match(radar,/from '..\/\_shared\/mira-business-spreadsheet-context\.mjs'/);
 assert.match(radar,/if\(isSpreadsheetBusinessContext\(t\)\|\|\/verschillende cijfers\|losse bestanden\//);
 assert.match(radar,/\|\|isSpreadsheetBusinessContext\(all\)/);
 assert.doesNotMatch(radar,/\/excel\|spreadsheet\|verschillende cijfers\|losse bestanden\//);
 assert.doesNotMatch(radar,/\/\(ondernemer\|bedrijf[^\n]*\|excel\|proces\|klant\)\//);
});
