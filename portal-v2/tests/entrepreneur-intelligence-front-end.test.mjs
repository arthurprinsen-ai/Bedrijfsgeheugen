import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registry=await readFile(new URL('../page-registry.js',import.meta.url),'utf8');
const shell=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
const workspace=await readFile(new URL('../modules/entrepreneur-intelligence.js',import.meta.url),'utf8');
const api=await readFile(new URL('../../netlify/functions/portal-ondernemersdata.mjs',import.meta.url),'utf8');
const edge=await readFile(new URL('../../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');

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
test('backend keeps authentication in Netlify and curated public-source reads in the Supabase Edge authority',()=>{
  assert.match(api,/getUser/);
  assert.match(api,/UNAUTHENTICATED/);
  assert.match(api,/getEntrepreneurIntelligence\(tenantId\)/);
  assert.doesNotMatch(api,/\/rest\/v1\//);
  assert.match(edge,/if\(action==='entrepreneur_intelligence'\)/);
  assert.match(edge,/from\('bronpublicaties'\)/);
  assert.match(edge,/from\('bg_externe_signalen'\)/);
  assert.match(edge,/select\('id,bron_id,titel,samenvatting,publicatiedatum,url,opgehaald_op,goedgekeurd,uitgever_url'\)/);
  assert.match(edge,/select\('url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,bevestiging,versheid,relevantie,vertrouwen,toegestaan,opgehaald_op,deadline'\)/);
  assert.doesNotMatch(edge,/\.from\('(?:bronpublicaties|bg_externe_signalen)'\)[\s\S]{0,180}\.select\('\*'\)/);
});
