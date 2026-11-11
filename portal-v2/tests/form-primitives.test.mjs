import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldMarkup, normalizeFieldValue, bindFields } from '../form-primitives.js';

const TYPES=['text','textarea','number','percentage','currency','date','select','multiselect','ranked','range','triState','owner','evidence','repeatable'];

test('shared form primitives render every approved functional input type',()=>{
  for(const type of TYPES){
    const html=fieldMarkup({id:`f-${type}`,label:`Veld ${type}`,type,options:['A','B'],min:1,max:5},type==='range'?3:'');
    assert.match(html,new RegExp(`data-field-id="f-${type}"`));
    assert.match(html,/v2field/);
    assert.match(html,/min-height:44px/);
  }
});

test('number, percentage, currency and range values normalize deterministically',()=>{
  assert.equal(normalizeFieldValue({type:'number'},'42'),42);
  assert.equal(normalizeFieldValue({type:'currency'},'52.5'),52.5);
  assert.equal(normalizeFieldValue({type:'percentage'},'8.4'),8.4);
  assert.equal(normalizeFieldValue({type:'range',min:1,max:5},'9'),5);
  assert.equal(normalizeFieldValue({type:'range',min:1,max:5},'0'),1);
});


test('shared form primitive preserves explicit native step constraints',()=>{
  const html=fieldMarkup({id:'legacy-step',label:'Legacy',type:'range',min:0,max:30000,step:1000},0);
  assert.match(html,/step="1000"/);
  assert.match(html,/min="0"/);
  assert.match(html,/max="30000"/);
});

test('empty and invalid numeric customer answers remain unknown instead of becoming measured zero',()=>{
  for(const type of ['number','currency','percentage','range']){
    const field={type,min:1,max:5};
    for(const raw of ['',null,undefined,'   ','not-a-number','Infinity']){
      assert.equal(normalizeFieldValue(field,raw),null,`${type} / ${String(raw)} must remain unknown`);
    }
  }
  for(const type of ['number','currency','percentage']){
    assert.equal(normalizeFieldValue({type},'0'),0,`${type} explicit zero must survive`);
  }
  assert.equal(normalizeFieldValue({type:'range',min:1,max:5},'0'),1);
});

test('clearing a required field removes its stale fact while malformed edits remain uncommitted',()=>{
  const cssBefore=globalThis.CSS;
  globalThis.CSS={escape:value=>String(value)};
  try{
    const listeners={};const received=[];const error={hidden:true,textContent:''};
    const node={
      value:'',multiple:false,validity:{valueMissing:true},
      checkValidity(){return !this.validity.valueMissing&&!this.validity.badInput;},
      closest(){return {querySelector:()=>error};},
      addEventListener(type,fn){listeners[type]=fn;},
      removeEventListener(type){delete listeners[type];},
      setAttribute(){},removeAttribute(){}
    };
    const root={querySelector:()=>node};
    const unbind=bindFields(root,[{id:'employees',type:'number',path:'portal.profile.employees',required:true}],{
      onChange:(_,value)=>received.push(value)
    });
    listeners.input();
    assert.deepEqual(received,[null],'cleared required value must reach central state as unknown');
    assert.equal(error.hidden,false);
    node.validity.valueMissing=false;
    node.validity.badInput=true;
    node.value='not-a-number';
    listeners.input();
    assert.deepEqual(received,[null],'malformed edits must not overwrite source facts');
    node.validity.badInput=false;
    node.value='0';
    listeners.change();
    assert.deepEqual(received,[null,0],'explicit zero is not unknown');
    unbind();
  }finally{
    if(cssBefore===undefined)delete globalThis.CSS;
    else globalThis.CSS=cssBefore;
  }
});
