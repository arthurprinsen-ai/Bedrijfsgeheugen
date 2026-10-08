import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDailyValuePortfolio,renderDailyValuePortfolio} from '../portal-v2/operating-system/daily-value-portfolio.js';

test('selects exactly top three canonical decisions, sorted, without synthetic metrics',()=>{
 const input={decisions:{items:[{id:'d4',portfolioBucket:'LATER',rank:0},{id:'d3',portfolioBucket:'NEXT',rank:3,title:'Drie'},{id:'d1',portfolioBucket:'NOW',rank:1,title:'Een',expectedValue:900,evidenceIds:['source']},{id:'d2',portfolioBucket:'NOW',rank:2,title:'Twee',status:'PROPOSED'},{id:'d1',portfolioBucket:'NOW',rank:1,title:'Duplicaat'}]}};
 const before=JSON.stringify(input),model=selectDailyValuePortfolio(input);
 assert.deepEqual(model.items.map(x=>x.id),['d1','d2','d3']);
 assert.equal(model.items[1].state,'APPROVAL_REQUIRED');
 assert.equal(model.items[2].expectedValue,null);
 assert.equal(JSON.stringify(input),before);
});
test('blocked actions never claim ready and empty runtime never fabricates priorities',()=>{
 assert.equal(selectDailyValuePortfolio({decisions:{items:[{id:'blocked',portfolioBucket:'NOW',blockedBy:'consent'}]}}).items[0].state,'BLOCKED');
 assert.deepEqual(selectDailyValuePortfolio({}).items,[]);
 assert.match(renderDailyValuePortfolio({}),/Nog geen onderbouwde prioriteiten/);
});
test('renders escaped source text and never renders fake euro figures',()=>{
 const html=renderDailyValuePortfolio({decisions:{items:[{id:'a',title:'<script>alert(1)</script>',portfolioBucket:'NOW'}]}});
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/Nog niet gekwantificeerd/);
 assert.doesNotMatch(html,/€\s*0/);
});
