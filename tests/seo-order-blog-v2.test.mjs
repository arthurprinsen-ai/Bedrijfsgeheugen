import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichBlog, inspectBlog } from '../tools/seo-order-engine/blog-contract-v2.mjs';

const registry={pages:[{route:'https://www.bedrijfsgeheugen.nl/bedrijfsgeheugen',role:'money',primary_intent:'bedrijfskennis borgen',primary_keyword:'bedrijfskennis borgen',secondary_keywords:['kennis borgen'],funnel_stage:'consider',primary_cta:{action:'frisse-blik',url:'https://www.bedrijfsgeheugen.nl/frisse-blik'}}]};
const base=`<!doctype html><html><head><title>Kennis borgen</title><meta name="description" content="Kennis borgen"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/blog/kennis-borgen/"><meta property="article:published_time" content="2026-09-05"></head><body><main><article><h1>Kennis borgen</h1><p>5 september 2026</p><h2>Zo borg je kennis</h2><ol><li>Leg vast</li><li>Maak eigenaar</li><li>Controleer</li></ol><a href="/blog/">Meer kennis</a></article></main></body></html>`;

test('blog v2 enrichment adds commercial intent contract and absolute links',()=>{const out=enrichBlog(base,'blog/kennis-borgen/index.html',registry);assert.match(out,/content="v2"/);assert.match(out,/name="bg-intent" content="bedrijfskennis borgen"/);assert.match(out,/data-bg-page-role="article"/);assert.match(out,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/"/);assert.match(out,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/bedrijfsgeheugen"/);assert.deepEqual(inspectBlog(out,'blog/kennis-borgen/index.html',registry),[]);});
test('blog v2 enrichment is idempotent',()=>{const once=enrichBlog(base,'blog/kennis-borgen/index.html',registry);assert.equal(enrichBlog(once,'blog/kennis-borgen/index.html',registry),once);});
