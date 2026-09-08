import test from 'node:test';
import assert from 'node:assert/strict';
import { CONNECTOR_TEMPLATES, SOURCE_ADAPTERS, LOOKUP_ADAPTERS, TARGET_ADAPTERS } from '../portal-next/connector-templates.js';

test('ships email PDF to AFAS, purchase invoice, ISO and blank templates',()=>{
  const ids=CONNECTOR_TEMPLATES.map(t=>t.id);
  assert.equal(ids.includes('email-pdf-afas'),true);
  assert.equal(ids.includes('purchase-invoice'),true);
  assert.equal(ids.includes('iso-document'),true);
  assert.equal(ids.includes('blank'),true);
});

test('email PDF to AFAS preserves earlier AFAS Document Intake metadata',()=>{
  const t=CONNECTOR_TEMPLATES.find(t=>t.id==='email-pdf-afas');
  assert.equal(t.legacy.solutionPattern,'AFAS Document Intake');
  assert.equal(t.legacy.flowPattern,'PA - Intake - Loonbeslag Email to AFAS');
  assert.equal(t.legacy.reviewPattern,'AFAS Document Intake Review');
  assert.equal(t.source.type,'email');
  assert.equal(t.source.acceptedMimeTypes.includes('application/pdf'),true);
  assert.equal(t.target.type,'afas');
});

test('purchase invoice and ISO templates expose editable extraction schemas',()=>{
  const invoice=CONNECTOR_TEMPLATES.find(t=>t.id==='purchase-invoice');
  const iso=CONNECTOR_TEMPLATES.find(t=>t.id==='iso-document');
  assert.equal(invoice.documentSchema.fields.some(f=>f.key==='invoice_number'),true);
  assert.equal(invoice.documentSchema.fields.some(f=>f.key==='supplier_name'),true);
  assert.equal(iso.documentSchema.fields.some(f=>f.key==='certificate_number'),true);
  assert.equal(iso.documentSchema.fields.some(f=>f.key==='expiry_date'),true);
});

test('purchase invoice template carries declarative duplicate PO and amount validation rules',()=>{
  const invoice=CONNECTOR_TEMPLATES.find(t=>t.id==='purchase-invoice');
  assert.equal(invoice.lookups.some(r=>r.id==='invoice_duplicate'),true);
  assert.equal(invoice.lookups.some(r=>r.id==='purchase_order'),true);
  assert.equal(invoice.validationRules.some(r=>r.code==='DUPLICATE_INVOICE'),true);
  assert.equal(invoice.validationRules.some(r=>r.code==='PO_NOT_RESOLVED'),true);
  assert.equal(invoice.validationRules.some(r=>r.code==='AMOUNT_VAT_MISMATCH'),true);
  for(const key of ['supplier_name','invoice_number','invoice_date','total_amount','currency'])assert.equal(invoice.mappings.some(m=>m.sourceField===key),true);
});

test('ISO template maps core certificate fields but does not claim an alert scheduler',()=>{
  const iso=CONNECTOR_TEMPLATES.find(t=>t.id==='iso-document');
  for(const key of ['standard','certificate_number','scope','expiry_date'])assert.equal(iso.mappings.some(m=>m.sourceField===key),true);
  assert.equal(JSON.stringify(iso).includes('alertScheduled'),false);
  assert.equal(JSON.stringify(iso).includes('scheduler'),false);
});

test('Datahub adapter metadata matches its native safe-test runtime capability',()=>{
  const datahub=TARGET_ADAPTERS.find(a=>a.id==='datahub');
  assert.equal(datahub.runtimeCapability,'native-safe-test');
});

test('adapter registries expose capability metadata without credentials',()=>{
  for(const registry of [SOURCE_ADAPTERS,LOOKUP_ADAPTERS,TARGET_ADAPTERS]){
    assert.equal(Array.isArray(registry),true);
    for(const adapter of registry){
      assert.equal(typeof adapter.id,'string');
      assert.equal(typeof adapter.label,'string');
      assert.equal(typeof adapter.supportsConfig,'boolean');
      assert.equal(typeof adapter.runtimeCapability,'string');
      const serialized=JSON.stringify(adapter).toLowerCase();
      assert.equal(serialized.includes('password'),false);
      assert.equal(serialized.includes('token'),false);
      assert.equal(serialized.includes('authorization'),false);
    }
  }
});
