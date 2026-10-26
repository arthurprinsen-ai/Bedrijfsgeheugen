import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Brain contract projects review state without compliance, privacy or AI approval inflation',async()=>{
 const source=await readFile(new URL('../portal-next/data-sovereignty-panel.js',import.meta.url),'utf8');
 assert.match(source,/const brainReview=s\.brainReview/);
 assert.match(source,/Object\.prototype\.hasOwnProperty\.call\(reviewStates,brainReview\.status\)/);
 assert.match(source,/Opvolging door het Brein:/);
 assert.match(source,/FULFILLED:'Administratief afgerond; inhoudelijk bewijs blijft vereist'/);
 assert.match(source,/Nog geen bevestigde Brain-status/);
 assert.match(source,/niet dat CSRD voor jouw organisatie verplicht is/);
 assert.doesNotMatch(source,/impact\.actor|impact\.changeId|brainReview\.evidence/);
});
