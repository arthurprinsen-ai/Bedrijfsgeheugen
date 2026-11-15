import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  isPersonalEditorialSourceSafe,
  classifyObservationalPersonalSource,
  canonicalPersonalSourceUrl,
  reconcileDatedPersonalSourceContext
} from '../supabase/functions/_shared/personal-observational-source-routing.mjs';

test('personal-life relevance alone cannot approve distressing violence news',()=>{
 const traumatic='Agent tasert pakketbezorger na foutparkeren Amsterdam';
 assert.equal(isPersonalEditorialSourceSafe({title:traumatic}),false);
 assert.equal(classifyObservationalPersonalSource({topic:'bezorging-en-pakketten',title:traumatic,excerpt:'Pakketbezorging bij een ongeval.'}),null);
 const ordinary='Pakketbezorging via het pakketpunt veroorzaakt wachtrijen';
 assert.equal(isPersonalEditorialSourceSafe({title:ordinary}),true);
 assert.equal(classifyObservationalPersonalSource({topic:'bezorging-en-pakketten',title:ordinary,excerpt:'Veel ontvangers ergeren zich aan lange wachtrijen.'}),'bezorging-en-pakketten');
});

test('dated secondary source may reuse advanced context ONLY for the same canonical HTTPS article',()=>{
 const key=canonicalPersonalSourceUrl('https://www.example.nl/nieuws/zelfde-artikel/?utm_source=search');
 const advancedByUrl=new Map([[key,'Volledige onafhankelijk ontvangen context '.repeat(12)]]);
 const args={url:'https://example.nl/nieuws/zelfde-artikel',snippet:'Kort nieuwssnippet',advancedByUrl};
 assert.ok(reconcileDatedPersonalSourceContext(args).length>=240);
 assert.equal(reconcileDatedPersonalSourceContext({...args,url:'https://example.nl/nieuws/ander-artikel'}),'Kort nieuwssnippet');
 assert.equal(reconcileDatedPersonalSourceContext({...args,url:'http://example.nl/nieuws/zelfde-artikel'}),'Kort nieuwssnippet');
 assert.equal(reconcileDatedPersonalSourceContext({...args,url:'https://wrong.example/nieuws/zelfde-artikel'}),'Kort nieuwssnippet');
 assert.equal(reconcileDatedPersonalSourceContext({...args,advancedByUrl:new Map([[key,'Kort']])}),'Kort nieuwssnippet');
});

test('existing one original radar uses same search budget, explicit typed editorial rejection and non-fabricated date',()=>{
 const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
 assert.ok(radar.includes('const search=async(q:string,channel:string)'));
 assert.ok(radar.includes('sourceResponses=await Promise.all(queries.map'));
 assert.ok(radar.includes("search_depth:personalDepth?'advanced':'basic'"));
 assert.ok(radar.includes('include_raw_content:true'));
 assert.ok(radar.includes('advancedPersonalContextByUrl'));
 assert.ok(radar.includes('reconcileDatedPersonalSourceContext({url:y.url'));
 assert.ok(radar.includes("contentProvider:context!==datedSnippet?'tavily_advanced_exact_url'"));
 assert.ok(radar.includes('source_context_provider:x.contentProvider||sr.provider'));
 assert.ok(radar.includes('source_date_provider:x.dateProvider||sr.provider'));
 assert.ok(radar.includes("reject('PERSONAL_EDITORIAL_SAFETY_REJECTED'"));
 assert.ok(radar.includes('publishedAt:isoFromProvider(y.timestamp||y.date)'));
 assert.ok(radar.includes('PERSONAL_OBSERVATIONAL_SOURCE_TEXT_INCOMPLETE'));
 assert.doesNotMatch(radar,/api\.tavily\.com\/extract|cron\.schedule|MAKE_FALLBACK_SCHEDULER|new ParallelPublisher/);
});
