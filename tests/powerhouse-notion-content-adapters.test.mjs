import test from 'node:test';
import assert from 'node:assert/strict';
import { notionConnectionToCoreEvent } from '../netlify/functions/powerhouse-notion-sync.mjs';
import { parseSitemap } from '../netlify/functions/powerhouse-content-observer.mjs';

const textProp=value=>({type:'rich_text',rich_text:[{plain_text:value}]});
const titleProp=value=>({type:'title',title:[{plain_text:value}]});
const urlProp=value=>({type:'url',url:value});
const selectProp=value=>({type:'select',select:{name:value}});
const numberProp=value=>({type:'number',number:value});

test('Notion priority connection becomes one evidence-grounded core activation event',()=>{
  const page={id:'n1',properties:{
    'Naam':titleProp('Ada Example'),
    'LinkedIn':urlProp('https://www.linkedin.com/in/ada-example'),
    'Bedrijf':textProp('Example BV'),
    'Functie':textProp('CEO'),
    'E-mail':{type:'email',email:'ada@example.com'},
    'Powerhouse reden':textProp('Prioriteit 1 en nog niet benaderd'),
    'Omzetkans':numberProp(5000),
    'Salesstatus':selectProp('Te doen'),
  }};
  const event=notionConnectionToCoreEvent(page);
  assert.equal(event.eventType,'connection_activated');
  assert.equal(event.profileUrl,'https://www.linkedin.com/in/ada-example');
  assert.equal(event.email,'ada@example.com');
  assert.equal(event.expectedValue,5000);
  assert.equal(event.source,'notion-connections');
});

test('sitemap parser discovers only blog and knowledge assets',()=>{
  const xml='<urlset><url><loc>https://www.bedrijfsgeheugen.nl/blog/a</loc><lastmod>2026-09-09</lastmod></url><url><loc>https://www.bedrijfsgeheugen.nl/kennis/b</loc></url><url><loc>https://www.bedrijfsgeheugen.nl/contact</loc></url></urlset>';
  const rows=parseSitemap(xml);
  assert.deepEqual(rows.map(x=>x.loc),['https://www.bedrijfsgeheugen.nl/blog/a','https://www.bedrijfsgeheugen.nl/kennis/b']);
});
