import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveArchitectureImpact} from '../../brain/knowledge/architecture-impact-resolver.mjs';

const registry={components:[{id:'website:homepage-hero-video',layer:'frontend',paths:['assets/js/menu.js','index.html'],docs:['Powerhouse Direct Knowledge Base'],tests:['website / targeted-browser','website / broad-browser'],rollbackOwner:'Website Release'}]};

test('maps homepage video change deterministically',()=>{
  const result=resolveArchitectureImpact({action:{technical_changes:['assets/js/menu.js']}},{registry,graphRecords:[],tenantId:'bedrijfsgeheugen'});
  assert.deepEqual(result.components,['website:homepage-hero-video']);
  assert.equal(result.confidence,1);
});

test('material unmapped change fails closed',()=>{
  const result=resolveArchitectureImpact({action:{technical_changes:['unknown/new.mjs']}},{registry,graphRecords:[],tenantId:'bedrijfsgeheugen'});
  assert.equal(result.status,'UNMAPPED');
});
