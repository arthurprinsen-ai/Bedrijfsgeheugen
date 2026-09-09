/**
 * Bewaakt dat er geen cockpitblok verdwijnt uit portal-next.
 * De labels zijn hernoemd ('Impact overzicht' -> 'Impact', 'Recente activiteiten'
 * -> 'Activiteit'); de blokken zelf staan er nog. De assertie op de exacte zin
 * '1-op-1 bestaande inhoud' is vervangen door een toets op de belofte zelf,
 * zodat een herformulering de bewaking niet meer omvergooit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reducePortalSelection, withCustomer, legacyTabForPage, buildLegacyPortalUrl, activateLegacyTabInDocument } from '../portal-next/portal-next.js';
const html=fs.readFileSync(new URL('../portal-next/index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../portal-next/portal-next.js',import.meta.url),'utf8');
const required=['Bedrijfsgezondheid','Kennisborging','Processen','Data & systemen','AI-volwassenheid','AI Management Summary','Aanbevelingen','Roadmap & voortgang','Kansen & bedreigingen','Impact','Activiteit','Snelle links','Het brein van je bedrijf'];
test('nieuwe cockpit behoudt alle bestaande overzichtsblokken',()=>{for(const label of required)assert.ok(html.includes(label),`missing overview block: ${label}`)});
test('mobile cockpit heeft bottom sheet en touch selectors',()=>{assert.ok(html.includes('data-mobile-flow-sheet'));assert.ok(html.includes('data-source-selector'));assert.ok(html.includes('data-module-selector'))});
test('mobiel laat één bron en één module tegelijk actief zijn',()=>{const a=reducePortalSelection({source:null,module:null},{type:'SELECT_SOURCE',id:'documenten',mobile:true});const b=reducePortalSelection(a,{type:'SELECT_SOURCE',id:'processen',mobile:true});assert.equal(b.source,'processen')});
test('klantcontext blijft behouden in deep link',()=>{global.window={location:{origin:'https://www.bedrijfsgeheugen.nl',search:'?klant=ijsselmonde'}};assert.equal(withCustomer('/klantportaal#roadmap','ijsselmonde'),'/klantportaal?klant=ijsselmonde#roadmap');assert.equal(buildLegacyPortalUrl('ijsselmonde'),'/klantportaal?klant=ijsselmonde')});
test('oude live tabs zijn bereikbaar via nieuwe pagina ids',()=>{assert.equal(legacyTabForPage('profiel'),'profiel');assert.equal(legacyTabForPage('ai-capabilities'),'aicap');assert.equal(legacyTabForPage('strategie-naar-maandagochtend'),'dna');assert.equal(legacyTabForPage('actueel-houden'),'bijhouden');assert.equal(legacyTabForPage('roadmap'),'roadmap')});
test('legacy bridge klikt exacte bestaande data-p tab',()=>{let clicked=false;const doc={querySelector(selector){assert.equal(selector,'[data-p="roadmap"]');return{click(){clicked=true}}}};assert.equal(activateLegacyTabInDocument(doc,'roadmap'),true);assert.equal(clicked,true)});
test('nieuwe shell mount een volledige portalbibliotheek en iframe workspace',()=>{assert.ok(js.includes("id='legacyWorkspace'"));assert.ok(js.includes("id=\"fullPortalNav\""));assert.ok(js.includes("id=\"legacyFrame\""));assert.match(js,/Bestaande live functionaliteit blijft beschikbaar|1-op-1 bestaande inhoud/)});
