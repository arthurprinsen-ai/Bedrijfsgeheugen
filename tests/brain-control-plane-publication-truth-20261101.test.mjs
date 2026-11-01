import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {summarizeDailyPublicationTruth} from '../supabase/functions/portal-state-eu/publication-delivery-read-model.js';
import {publicationDeliveryMarkup,controlPlaneCockpitMarkup} from '../portal-v2/control-plane-cockpit.js';

const date='2026-11-01';
const rows=[
 {channel:'linkedin_personal',status:'PUBLISHED',external_id:'urn:li:share:7522660274441670656',canonical_url:'https://www.linkedin.com/feed/update/urn:li:share:7522660274441670656/',approved_at:null,live_proven_at:null},
 {channel:'linkedin_company',status:'FAILED',external_id:null,last_error:'PRE_PUBLISH_GATE_BLOCKED'},
 {channel:'instagram',status:'BLOCKED',external_id:null,last_error:'MEDIA_ASSET_REQUIRED'},
 {channel:'blog',status:'GENERATED',approved_at:null,external_id:null,canonical_url:'https://www.bedrijfsgeheugen.nl/blog/not-yet-live/'}
];
test('original 1 Nov 1/4 provider ack and 0 independent live; generated blog needs CMS approval',()=>{
 const d=summarizeDailyPublicationTruth(rows,date);
 assert.equal(d.contract,'powerhouse-original-publication-delivery-truth-v1');
 assert.equal(d.providerAcknowledged,1);
 assert.equal(d.independentlyProven,0);
 assert.equal(d.healthy,false);
 assert.equal(d.channels.find(x=>x.channel==='blog').proofState,'CMS_APPROVAL_REQUIRED');
 assert.equal(d.channels.find(x=>x.channel==='linkedin_company').proofState,'ORIGINAL_STORY_RECOVERY_DUE');
 assert.equal(d.channels.find(x=>x.channel==='instagram').proofState,'MIRA_MEDIA_PROOF_REQUIRED');
 const li=d.channels.find(x=>x.channel==='linkedin_personal');
 assert.equal(li.proofState,'PROVIDER_ACK_ONLY');
 assert.equal(li.independentlyProven,false);
 assert.match(li.publicUrl,/^https:\/\/www\.linkedin\.com\//);
});
test('approval alone is not a release nor provider receipt',()=>{
 const r=rows.map(x=>x.channel==='blog'?{...x,status:'APPROVED',approved_at:'2026-11-01T20:00:00Z'}:x);
 const d=summarizeDailyPublicationTruth(r,date);
 assert.equal(d.channels.find(x=>x.channel==='blog').proofState,'APPROVED_DELIVERY_PENDING');
 assert.equal(d.providerAcknowledged,1);
 assert.equal(d.healthy,false);
});
test('provider ack is not independent readback; independently proven requires both date and exact provider ID',()=>{
 const r=rows.map(x=>x.channel==='blog'?{...x,status:'LIVE_PROVEN',approved_at:'2026-11-01T20:00:00Z',live_proven_at:'2026-11-01T21:00:00Z'}:x);
 let d=summarizeDailyPublicationTruth(r,date);
 assert.equal(d.channels.find(x=>x.channel==='blog').independentlyProven,false);
 r.find(x=>x.channel==='blog').external_id='verified-provider-ref';
 d=summarizeDailyPublicationTruth(r,date);
 assert.equal(d.independentlyProven,1);
 assert.equal(d.healthy,false);
});
test('malformed or absent canonical data never results in green',()=>{
 assert.equal(summarizeDailyPublicationTruth(undefined,date).healthy,false);
 assert.equal(summarizeDailyPublicationTruth([],'garbled').sourceState,'INVALID_DATE');
 assert.equal(summarizeDailyPublicationTruth([],date).providerAcknowledged,0);
});
test('admin UI visibly distinguishes approval, 1/4 provider send and absent independent proof, with safe full href',()=>{
 const payload=summarizeDailyPublicationTruth(rows,date);
 const html=publicationDeliveryMarkup(payload);
 assert.match(html,/Wacht op redactionele goedkeuring/);
 assert.match(html,/1 van 4 verzendbewijzen/);
 assert.match(html,/0 onafhankelijk live bewezen/);
 assert.match(html,/Providerverzending bevestigd/);
 assert.match(html,/href="https:\/\/www\.linkedin\.com\/feed\/update\//);
 assert.doesNotMatch(html,/<a href="\/feed/);
 assert.match(controlPlaneCockpitMarkup({publicationDelivery:payload}),/Dagpublicaties/);
});
test('portal escapes original potentially malicious source errors and does not show unacknowledged link',()=>{
 const injected=rows.map(x=>x.channel==='blog'?{...x,last_error:'<script>alert(1)</script>',canonical_url:'https://evil.example/hack'}:x);
 const html=publicationDeliveryMarkup(summarizeDailyPublicationTruth(injected,date));
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/evil\.example/);
});
test('only ORIGINAL read-only admin surface queries canonical provider truth; never an approval or second executor',async()=>{
 const edge=await readFile(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
 const view=await readFile(new URL('../portal-v2/control-plane-cockpit.js',import.meta.url),'utf8');
 const block=edge.slice(edge.indexOf("if(action==='control_plane_cockpit')"),edge.indexOf("if(action==='data_sovereignty_get')"));
 assert.match(block,/content_publication_obligations/);
 assert.match(block,/summarizeDailyPublicationTruth\(publicationRows,publicationDate\)/);
 assert.match(block,/publicationDelivery/);
 assert.doesNotMatch(block,/\.insert\(|\.update\(|\.upsert\(|\.delete\(|rpc\(/);
 assert.match(view,/publicationDeliveryMarkup\(data\.publicationDelivery\)/);
 assert.match(view,/\/api\/powerhouse-control-plane/);
 assert.doesNotMatch(block,/approved_at:\s*new Date|approved_at:\s*now\(\)/);
});
