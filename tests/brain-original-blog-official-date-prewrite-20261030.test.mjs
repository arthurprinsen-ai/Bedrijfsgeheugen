import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessOfficialBlogDateTruth} from '../supabase/functions/_shared/blog-official-date-truth.mjs';

const rule=(title,body,cta='',runDate='2026-10-30')=>
  assessOfficialBlogDateTruth({title,body,cta,runDate});
const title='Circular Plastics NL subsidie: planning voor plasticrecyclers';

test('historical replay: incorrect CPNL opening 6 October fails BEFORE writing an artifact',()=>{
  const actual=rule(title,'Volgens een recente voorspelling opent de Circular Plastics NL-subsidie op 6 oktober 2026 met een totaalbudget van €40 miljoen.');
  assert.equal(actual.ok,false);
  assert.equal(actual.code,'BLOG_OFFICIAL_SUBSIDY_DEADLINE_INVERTED');
  assert.equal(actual.published_approval_allowed,false);
  assert.equal(actual.source,'https://www.rvo.nl/subsidies-financiering/cpnl');
});

test('correct official closing date and closed-round context pass, without falsely claiming publication',()=>{
  const actual=rule('Circular Plastics NL 2026 is gesloten: vijf acties voor plasticrecyclers',
    'RVO bevestigt dat deze CPNL-aanvraagperiode liep van 21 april 2026 om 09:00 tot 6 oktober 2026 om 17:00. De aanvraagperiode is gesloten. Bepaal op basis van gemeten businesscase of een andere aantoonbaar passende regeling relevant is.',
    'Geen open aanvraag beloven; controleer RVO.');
  assert.deepEqual({ok:actual.ok,code:actual.code},
    {ok:true,code:'CPNL_CLAIM_NO_KNOWN_INVERSION'});
  assert.equal(actual.source,'https://www.rvo.nl/subsidies-financiering/cpnl');
});

test('unrelated topic never inherits subsidy assumptions or authority',()=>{
  assert.equal(rule('Facturen beter opvolgen','Maak een prioriteitenlijst op basis van werkelijk openstaande facturen.').code,
    'NO_CPNL_SPECIFIC_CLAIM');
});

test('shadow and canary contract: original Content Orchestrator enforces prewrite and reuses one authorized model',()=>{
  const source=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  const queue=readFileSync('supabase/functions/powerhouse-blog-queue/index.ts','utf8');
  const beforeWrite=source.slice(0,source.indexOf("stage = 'write-artifact';"));
  assert.match(source,/import \{ assessOfficialBlogDateTruth \} from '\.\.\/_shared\/blog-official-date-truth\.mjs'/);
  assert.match(beforeWrite,/officialBlogDateTruth=assessOfficialBlogDateTruth/);
  assert.match(beforeWrite,/BLOG_OFFICIAL_DATE_SOURCE_REWRITE_REJECTED/);
  assert.match(beforeWrite,/BLOG_OFFICIAL_DATE_SOURCE_REPAIR_NOT_AUTHORIZED/);
  assert.match(beforeWrite,/if\(!officialBlogDateTruth.ok\)/);
  assert.match(beforeWrite,/if\(generationProvider!=='OpenAI'\|\|!apiKey\)/);
  assert.match(beforeWrite,/official_source_correction:sourceFact/);
  assert.match(source,/original_queue_second_gate_required:true/);
  assert.match(source,/publication_proven:false/);
  assert.match(queue,/assessOfficialBlogDateTruth\(\{title:a.title,body:a.body,cta:a.cta,runDate\}\)/);
  assert.match(queue,/BLOG_LINEAGE_MISMATCH_EXTERNAL_STATE/);
  const prewriteIndex=source.indexOf('officialBlogDateTruth=assessOfficialBlogDateTruth');
  const persistIndex=source.indexOf("stage = 'write-artifact';");
  assert.ok(prewriteIndex>=0&&persistIndex>prewriteIndex,'No prewrite source check after mutation');
  assert.doesNotMatch(beforeWrite,/\.from\('content_publication_obligations'\)\.update\(/);
});

test('runtime evidence remains separately verifiable: this code cannot claim publication or paid outcome',()=>{
  const source=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
  assert.match(source,/official_blog_source_prewrite:pending.channel==='blog'/);
  assert.match(source,/publication_proven:false/);
  assert.match(source,/original_queue_second_gate_required:true/);
  // Human source incident #4439 and the existing canonical ONE BRAIN record
  // preserve the observed release gap; source-level tests do not fabricate
  // a natural agent invocation or immutable provider publication receipt.
});
