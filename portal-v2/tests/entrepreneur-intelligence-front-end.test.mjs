import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registry=await readFile(new URL('../page-registry.js',import.meta.url),'utf8');
const shell=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
const workspace=await readFile(new URL('../modules/entrepreneur-intelligence.js',import.meta.url),'utf8');
const api=await readFile(new URL('../../netlify/functions/portal-ondernemersdata.mjs',import.meta.url),'utf8');

const pages=['ondernemersdata','wet-regelgeving','arbeidsmarkt-personeel','subsidies-regelingen','economie-branche-actueel','ai-technologie-actueel','deadlines','bronnenbibliotheek'];

test('Actueel & externe data is a first-class Portal V2 navigation group',()=>{
  assert.match(registry,/Actueel & externe data/);
  for(const id of pages)assert.ok(registry.includes(id),id+' ontbreekt in page registry');
});
test('all entrepreneur intelligence pages use the specialist workspace',()=>{
  assert.match(shell,/mountEntrepreneurIntelligence/);
  assert.match(shell,/ENTREPRENEUR_DATA_PAGES/);
  for(const id of pages)assert.ok(shell.includes(id),id+' ontbreekt in shell routing');
});
test('workspace exposes laws and live UWV RVO CBS source projections',()=>{
  assert.match(workspace,/REGELGEVING/);
  assert.match(workspace,/UWV/);
  assert.match(workspace,/RVO/);
  assert.match(workspace,/CBS/);
  assert.match(workspace,/\/api\/portal-ondernemersdata/);
});
test('backend returns only curated public-source fields through authenticated portal route',()=>{
  assert.match(api,/getUser/);
  assert.match(api,/UNAUTHENTICATED/);
  assert.match(api,/bronpublicaties\?select=/);
  assert.match(api,/bg_externe_signalen\?select=/);
  assert.doesNotMatch(api,/select=\*/);
});
