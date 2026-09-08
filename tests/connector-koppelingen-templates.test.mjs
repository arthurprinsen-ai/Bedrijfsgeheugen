import test from 'node:test';
import assert from 'node:assert/strict';
import {KOPPELING_TEMPLATES,findTemplate} from '../assets/js/koppelingen/templates.js';

test('catalog ships at least 15 task-oriented templates',()=>{
  assert.ok(KOPPELING_TEMPLATES.length>=15);
});

test('every template exposes the safe guided-setup contract',()=>{
  for(const template of KOPPELING_TEMPLATES){
    for(const key of ['id','title','result','source','filters','documentType','fields','targets','defaultSchedule','connections','testStrategy','fallback','questions']){
      assert.ok(Object.hasOwn(template,key),`${template.id||'template'} missing ${key}`);
    }
    assert.ok(Array.isArray(template.fields));
    assert.ok(Array.isArray(template.targets));
    assert.ok(Array.isArray(template.questions));
    assert.ok(template.source&&typeof template.source.type==='string');
  }
});

test('Outlook PDF invoice template has safe defaults',()=>{
  const t=findTemplate('outlook-pdf-facturen');
  assert.ok(t);
  assert.equal(t.source.type,'email');
  assert.equal(t.documentType,'invoice');
  assert.equal(t.defaultSchedule,'dag');
  assert.ok(t.targets.includes('datahub'));
  assert.ok(t.fields.includes('factuurnummer'));
  assert.equal(t.testStrategy,'safe-test');
});

test('provider-dependent templates never claim readiness in catalog data',()=>{
  const serialized=JSON.stringify(KOPPELING_TEMPLATES);
  assert.doesNotMatch(serialized,/"(?:ready|healthy)"\s*:/i);
  assert.doesNotMatch(serialized,/(?:secret|password|api[_-]?key|token)/i);
});
