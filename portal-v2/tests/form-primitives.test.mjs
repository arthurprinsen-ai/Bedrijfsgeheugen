import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldMarkup, normalizeFieldValue } from '../form-primitives.js';

const TYPES=['text','textarea','number','percentage','currency','date','select','multiselect','ranked','range','triState','owner','evidence','repeatable'];

test('shared form primitives render every approved functional input type',()=>{
  for(const type of TYPES){
    const html=fieldMarkup({id:`f-${type}`,label:`Veld ${type}`,type,options:['A','B'],min:1,max:5},type==='range'?3:'');
    assert.match(html,new RegExp(`data-field-id="f-${type}"`));
    assert.match(html,/v2field/);
  }
});

test('number, percentage, currency and range values normalize deterministically',()=>{
  assert.equal(normalizeFieldValue({type:'number'},'42'),42);
  assert.equal(normalizeFieldValue({type:'currency'},'52.5'),52.5);
  assert.equal(normalizeFieldValue({type:'percentage'},'8.4'),8.4);
  assert.equal(normalizeFieldValue({type:'range',min:1,max:5},'9'),5);
  assert.equal(normalizeFieldValue({type:'range',min:1,max:5},'0'),1);
});
