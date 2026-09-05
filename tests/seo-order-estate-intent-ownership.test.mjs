import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applySeoOrderEngine } from '../tools/seo-order-engine/apply.mjs';
import { validateRegistry } from '../tools/seo-order-engine/registry.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';

function registryFixture(){return {version:1,origin:ORIGIN,pages:[
  {route:`${ORIGIN}/`,role:'pillar',primary_intent:'digitalisering mkb',primary_keyword:'digitalisering mkb',secondary_keywords:['mkb digitaliseren'],funnel_stage:'discover',primary_cta:{action:'zelfscan',url:`${ORIGIN}/zelfscan`},supporting_routes:[],schema_type:'WebPage'},
  {route:`${ORIGIN}/afas-koppeling`,role:'money',primary_intent:'afas koppeling',primary_keyword:'afas koppeling',secondary_keywords:['afas api koppeling'],funnel_stage:'decide',primary_cta:{action:'frisse-blik',url:`${ORIGIN}/frisse-blik`},supporting_routes:[],schema_type:'Service'}
]};}

function html(canonical,title='Proces automatiseren'){return `<!doctype html><html><head><title>${title}</title><meta name="description" content="${title}"><link rel="canonical" href="${canonical}"></head><body><main><h1>${title}</h1><a href="${ORIGIN}/">Home</a><a href="${ORIGIN}/zelfscan">Zelfscan</a></main></body></html>`;}

test('registry blocks a future primary keyword that is already owned as a secondary keyword',()=>{
  const registry=registryFixture();
  registry.pages.push({route:`${ORIGIN}/afas-api`,role:'money',primary_intent:'afas api koppeling',primary_keyword:'afas api koppeling',secondary_keywords:[],funnel_stage:'decide',primary_cta:{action:'frisse-blik',url:`${ORIGIN}/frisse-blik`},supporting_routes:[],schema_type:'Service'});
  const errors=validateRegistry(registry);
  assert.ok(errors.some(error=>/keyword.*owned|cluster.*owned|keyword.*collision/i.test(error)),errors.join('\n'));
});

test('estate enrichment covers future nested pages and marks them as supporting an explicit primary owner',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'bg-seo-estate-'));
  const previous=process.cwd();
  try{
    await mkdir(join(dir,'site'),{recursive:true});
    await mkdir(join(dir,'oplossingen','proces'),{recursive:true});
    await writeFile(join(dir,'site','seo-order-map.json'),JSON.stringify(registryFixture()),'utf8');
    await writeFile(join(dir,'index.html'),html(`${ORIGIN}/`,'Digitalisering mkb'),'utf8');
    await writeFile(join(dir,'oplossingen','proces','index.html'),html(`${ORIGIN}/oplossingen/proces`),'utf8');
    process.chdir(dir);
    await applySeoOrderEngine();
    const out=await readFile(join(dir,'oplossingen','proces','index.html'),'utf8');
    assert.match(out,/data-bg-intent-role="supporting"/);
    assert.match(out,/data-bg-intent-owner="https:\/\/www\.bedrijfsgeheugen\.nl\/"/);
    assert.doesNotMatch(out,/data-bg-intent="digitalisering mkb"/);
  } finally {
    process.chdir(previous);
    await rm(dir,{recursive:true,force:true});
  }
});

test('estate enrichment covers future nested blog paths',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'bg-seo-blog-estate-'));
  const previous=process.cwd();
  try{
    await mkdir(join(dir,'site'),{recursive:true});
    await mkdir(join(dir,'blog','2026','kennis-borgen'),{recursive:true});
    await writeFile(join(dir,'site','seo-order-map.json'),JSON.stringify(registryFixture()),'utf8');
    await writeFile(join(dir,'index.html'),html(`${ORIGIN}/`,'Digitalisering mkb'),'utf8');
    const blog=`<!doctype html><html><head><title>AFAS API koppeling uitleg</title><meta name="description" content="AFAS API koppeling"><link rel="canonical" href="${ORIGIN}/blog/2026/kennis-borgen/"><meta property="article:published_time" content="2026-09-05"></head><body><main><article><h1>AFAS API koppeling uitleg</h1><p>5 september 2026</p><h2>Zo werkt de AFAS API koppeling</h2><ol><li>Analyseer</li><li>Koppel</li><li>Controleer</li></ol><a href="${ORIGIN}/blog/">Kennis</a><a href="${ORIGIN}/afas-koppeling">AFAS koppeling</a></article></main></body></html>`;
    await writeFile(join(dir,'blog','2026','kennis-borgen','index.html'),blog,'utf8');
    process.chdir(dir);
    await applySeoOrderEngine();
    const out=await readFile(join(dir,'blog','2026','kennis-borgen','index.html'),'utf8');
    assert.match(out,/content="v2"/);
    assert.match(out,/name="bg-intent-owner" content="https:\/\/www\.bedrijfsgeheugen\.nl\/afas-koppeling"/);
    assert.match(out,/data-bg-intent-role="supporting"/);
  } finally {
    process.chdir(previous);
    await rm(dir,{recursive:true,force:true});
  }
});
