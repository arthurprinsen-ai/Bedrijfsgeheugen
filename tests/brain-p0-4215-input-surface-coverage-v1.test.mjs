import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPortalInputCoverageMatrix,MATRIX_CONTRACT} from '../tools/ci/p0-4215-portal-input-coverage-matrix.mjs';
import {inventoryPortalCustomerFields} from '../portal-v2/contextual-action-cards.js';
import {allPageIds} from '../portal-v2/page-registry.js';
import {SUPPLEMENTAL_PORTAL_INPUT_SURFACES} from '../portal-v2/input-impact-coverage.js';

test('every registered native field declaration produces one auditable renderer binding and consequence mapping',()=>{
  const matrix=buildPortalInputCoverageMatrix();
  assert.equal(matrix.contract,MATRIX_CONTRACT);
  assert.equal(matrix.summary.registeredPages,allPageIds().length);
  assert.ok(matrix.summary.declaredNativeControls>=70,'unexpected native input coverage regression');
  assert.deepEqual(matrix.errors,[],'every bad field must fail admission with explicit error');
  const native=matrix.rows.filter(row=>row.surface==='NATIVE_SCHEMA_RENDERER');
  assert.equal(native.length,matrix.summary.declaredNativeControls);
  const perLocation=new Set();
  for(const row of native){
    assert.ok(row.rendererControlVerified,row.page+':'+row.fieldId);
    assert.equal(row.mappingStatus,'MAPPED',row.path);
    assert.ok(row.modelFamilies.length>0);
    assert.ok(row.affectedPages.length>0);
    assert.match(row.path,/^portal\./);
    assert.equal(row.writeEndpoint,'/api/portal-business-input');
    assert.equal(row.readbackEndpoint,'/api/portal-state');
    assert.equal(row.status,'DECLARED_RENDERER_ONLY');
    assert.equal(row.authenticatedWriteVerified,false);
    assert.equal(row.browserDomVerified,false);
    assert.equal(row.brainConsumerAck,'NOT_OBSERVED');
    const key=row.page+':'+row.fieldId;
    assert.ok(!perLocation.has(key),'duplicate DOM field id '+key);
    perLocation.add(key);
  }
});

test('previously registered contextual field declarations are all represented in the matrix',()=>{
  const matrix=buildPortalInputCoverageMatrix();
  const allPaths=new Set(matrix.rows.filter(row=>row.path).map(row=>row.path));
  for(const field of inventoryPortalCustomerFields())assert.ok(allPaths.has(field.path),field.path);
});

test('unverified standalone, dynamic, connector and policy forms remain explicit proof gaps',()=>{
  const matrix=buildPortalInputCoverageMatrix();
  assert.equal(matrix.summary.supplementalSurfaces,SUPPLEMENTAL_PORTAL_INPUT_SURFACES.length);
  const dynamic=matrix.rows.filter(row=>row.surface==='DYNAMIC_OR_EXTERNAL');
  const missing=SUPPLEMENTAL_PORTAL_INPUT_SURFACES.filter(surface=>!surface.paths.length);
  assert.equal(dynamic.length,missing.length);
  for(const row of dynamic){
    assert.equal(row.status,'UNENUMERATED_FIELDS_REVIEW_REQUIRED');
    assert.equal(row.authenticatedWriteVerified,false);
    assert.equal(row.writeEndpoint,null);
  }
  for(const page of matrix.pagesWithoutDeclaredFields)assert.ok(allPageIds().includes(page));
  assert.equal(matrix.summary.customerLiveVerified,false);
  assert.equal(matrix.summary.closureReady,false);
  assert.equal(matrix.tenantIsolation,'NOT_TESTED_BY_THIS_REPORT');
  assert.equal(matrix.officialCsrdApplicability,'CUSTOMER_SPECIFIC_LEGAL_REVIEW_REQUIRED');
});

test('repeatable columns cannot pass as verified runtime row bindings',()=>{
  const repeatables=buildPortalInputCoverageMatrix().rows.filter(row=>row.repeatableColumns?.length);
  for(const row of repeatables){
    for(const col of row.repeatableColumns)assert.equal(col.runtimeRowBinding,'REVIEW_REQUIRED');
  }
});
