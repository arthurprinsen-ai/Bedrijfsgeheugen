import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const netlify=fs.readFileSync('netlify.toml','utf8');
const routes=[
  'automotive-software-koppelen',
  'bouw-software-koppelen',
  'horeca-software-koppelen',
  'industrie-productie-software-koppelen',
  'koppelingen-per-branche',
  'logistiek-software-koppelen',
  'retail-ecommerce-software-koppelen',
  'vastgoed-software-koppelen',
  'zakelijke-dienstverlening-software-koppelen',
  'zorg-software-koppelen'
];

test('branch landing pages redirect legacy .html URLs to canonical extensionless routes',()=>{
  for(const route of routes){
    assert.ok(netlify.includes('from = "/'+route+'.html"'),route+' legacy source');
    assert.ok(netlify.includes('to = "/'+route+'"'),route+' canonical target');
  }
});
