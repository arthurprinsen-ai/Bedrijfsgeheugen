import test from 'node:test';
import assert from 'node:assert/strict';
import {repairApprovedBlogMeta, validateApprovedBlog} from '../tools/content-growth/openai-approved-blog.mjs';

const introduction = "Veel ondernemers missen samenhang tussen de beschikbare cijfers, de afspraken in hun team en de dagelijkse keuzes. Door eerst de werkelijke knelpunten te onderzoeken wordt duidelijk waar de uitvoering beter kan.";
const body = [introduction,'## Wat gaat er mis?',Array(155).fill('Meet de bestaande situatie, controleer de bron en koppel elke verbetering aan een eigenaar.').join(' '),'## Wat kun je doen?',Array(25).fill('Evalueer de uitkomst en verbeter het proces op basis van aantoonbare feiten.').join(' ')].join('\n\n');
const basic={title:'Zo maak je dagelijkse keuzes beter onderbouwd',slug:'dagelijkse-keuzes-onderbouwen',keyword:'beslissingen onderbouwen',meta:'Een compacte beschrijving',blogtext:body,brain_reason:'Public marketing-learning signal is aggregated; no customer facts claimed.'};

test('too short SEO meta derives from the generated evidence, never fabricates facts',()=>{
  const fixed=repairApprovedBlogMeta(basic);
  assert.notEqual(fixed.meta,basic.meta);
  assert.ok(fixed.meta.length>=120 && fixed.meta.length<=170);
  assert.match(fixed.meta,/Veel ondernemers missen samenhang/);
  assert.equal(fixed.blogtext,basic.blogtext);
  assert.doesNotThrow(()=>validateApprovedBlog(fixed));
});

test('too long SEO meta cuts on a word boundary inside existing approved content',()=>{
  const long={...basic,meta:'De bestaande ondernemersinformatie helpt een team om beslissingen te toetsen aan de echte processtappen en vervolgens de acties die vandaag prioriteit hebben helder te maken zonder nieuwe gegevens of klantresultaten te verzinnen.'};
  const fixed=repairApprovedBlogMeta(long);
  assert.ok(fixed.meta.length>=120 && fixed.meta.length<=170);
  assert.ok(long.meta.startsWith(fixed.meta.slice(0,-1)));
  assert.doesNotThrow(()=>validateApprovedBlog(fixed));
});

test('in-range SEO meta remains identical',()=>{
  const good={...basic,meta:'Maak belangrijke knelpunten zichtbaar, onderbouw dagelijkse beslissingen met bestaande gegevens en vertaal de uitkomsten naar uitvoerbare acties in je bedrijf.'};
  assert.equal(repairApprovedBlogMeta(good).meta,good.meta);
});

test('unrecoverable meta, unsupported input and substantive quality violations fail closed',()=>{
  assert.throws(()=>validateApprovedBlog(repairApprovedBlogMeta({...basic,blogtext:'Kort.'})),/OPENAI_BLOG_META_INVALID/);
  assert.equal(repairApprovedBlogMeta(null),null);
  assert.throws(()=>validateApprovedBlog(repairApprovedBlogMeta({...basic,blogtext:body.slice(0,200)})),/OPENAI_BLOG_WORD_COUNT_INVALID/);
});
