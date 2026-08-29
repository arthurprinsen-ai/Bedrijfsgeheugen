import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceRegistry, createSourceConflict } from '../platform/integrations/source-registry.mjs';
import { adaptNotionRecord } from '../platform/integrations/notion-adapter.mjs';
import { adaptMakeScenario } from '../platform/integrations/make-adapter.mjs';

test('source registry allows exactly one source of record per datatype', () => {
  const registry = createSourceRegistry([
    { dataType: 'Customer', sourceKind: 'crm', sourceRef: 'CRM/customers' },
    { dataType: 'Invoice', sourceKind: 'erp', sourceRef: 'ERP/invoices' },
  ]);
  assert.equal(registry.get('Customer').sourceKind, 'crm');
  assert.throws(() => createSourceRegistry([
    { dataType: 'Customer', sourceKind: 'crm', sourceRef: 'CRM/customers' },
    { dataType: 'Customer', sourceKind: 'notion', sourceRef: 'Notion/customers' },
  ]), /duplicate source-of-record/i);
});

test('source conflict is explicit instead of silently selecting a winner', () => {
  const conflict = createSourceConflict({
    id: 'CONFLICT-1', tenantId: 'TENANT-DEMO', dataType: 'PricePlan',
    candidates: [{ source: 'billing', value: 299 }, { source: 'website', value: 349 }],
  });
  assert.equal(conflict.type, 'SourceConflict');
  assert.equal(conflict.status, 'Open');
});

test('Notion data is normalized with source provenance, not promoted to business truth', () => {
  const object = adaptNotionRecord({ tenantId: 'TENANT-DEMO', databaseId: 'DB1', pageId: 'P1', objectType: 'Action', properties: { status: 'Open' } });
  assert.equal(object.truthClass, 'SourceTruth');
  assert.equal(object.provenance.sourceType, 'notion');
  assert.equal(object.data.status, 'Open');
});

test('Make scenario is represented as integration health without leaking Make structure into the portal contract', () => {
  const object = adaptMakeScenario({ tenantId: 'TENANT-DEMO', scenarioId: '42', name: 'Publish blog', enabled: true, lastError: 'timeout', operations: 17, cost: 0.03, criticality: 'Medium' });
  assert.equal(object.type, 'Integration');
  assert.equal(object.health, 'Attention');
  assert.equal(object.verification, 'Failed');
  assert.equal(object.provenance.sourceType, 'make');
});
