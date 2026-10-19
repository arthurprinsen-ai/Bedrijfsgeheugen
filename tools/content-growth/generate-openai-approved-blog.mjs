import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const MODEL = 'gpt-5-mini';
const SCHEMA = {
  type: 'object',
  properties: {
    title: {type: 'string'},
    slug: {type: 'string'},
    keyword: {type: 'string'},
    meta: {type: 'string'},
    blogtext: {type: 'string'},
    brain_reason: {type: 'string'}
  },
  required: ['title','slug','keyword','meta','blogtext','brain_reason'],
  additionalProperties: false
};

function responseText(payload) {
  if (payload?.status !== 'completed') throw new Error('OPENAI_BLOG_RESPONSE_NOT_COMPLETED');
  const refusal = (payload?.output || []).flatMap(item => item?.content || [])
    .find(item => item?.type === 'refusal');
  if (refusal) throw new Error('OPENAI_BLOG_RESPONSE_REFUSED');
  const text = typeof payload?.output_text === 'string' ? payload.output_text
    : (payload?.output || []).flatMap(item => item?.content || [])
      .filter(item => item?.type === 'output_text' && typeof item?.text === 'string')
      .map(item => item.text).join('');
  if (!text.trim()) throw new Error('OPENAI_BLOG_RESPONSE_EMPTY');
  return text;
}

export function validateApprovedBlogCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
    throw new Error('OPENAI_BLOG_CANDIDATE_NOT_OBJECT');
  if (Object.keys(candidate).sort().join(',') !== Object.keys(SCHEMA.properties).sort().join(','))
    throw new Error('OPENAI_BLOG_CANDIDATE_SHAPE_INVALID');
  const data = Object.fromEntries(Object.keys(SCHEMA.properties).map(key => [key, candidate[key]]));
  if (Object.values(data).some(value => typeof value !== 'string' || !value.trim()))
    throw new Error('OPENAI_BLOG_CANDIDATE_REQUIRED_TEXT_MISSING');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug))
    throw new Error('OPENAI_BLOG_SLUG_INVALID');
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(String(process.env.BUSINESS_DATE || '2026-10-19')))
    throw new Error('OPENAI_BLOG_BUSINESS_DATE_INVALID');
  return data;
}

// Never transmit the downloaded BRAIN payload (which may contain commercial or
// customer information) to an external model. Only a finite, public editorial
// topic chosen locally is allowed across the provider boundary.
export function selectApprovedPublicTopic(learning) {
  const candidates = Array.isArray(learning?.learning?.exploit_candidates)
    ? learning.learning.exploit_candidates : [];
  const knownKnowledgeTopic = candidates.some(row =>
    typeof row?.content_id === 'string' && row.content_id === 'blog:bedrijfskennis-borgen'
  );
  if (knownKnowledgeTopic) return {
    topic: 'Bedrijfskennis borgen en overdraagbaar maken',
    editorial_angle: 'Een praktisch overdraagbaar bedrijfsproces met eigenaarschap en controles',
    proof_boundary: 'Onderwerp geselecteerd op lokaal BRAIN-signaal; geen externe prestatiecijfers als bewijs'
  };
  const observed = learning?.learning?.confidence?.observed_items;
  if (typeof observed === 'number' && Number.isFinite(observed) && observed > 0) return {
    topic: 'Van verspreide bedrijfsinformatie naar dagelijkse werkafspraken',
    editorial_angle: 'Welke operationele controles maken bestaande kennis praktisch bruikbaar?',
    proof_boundary: 'Algemene MKB-uitleg; geen individuele klantdata of onbewezen resultaten'
  };
  return {
    topic: 'Kennisborging voor continuiteit in het mkb',
    editorial_angle: 'Een concreet stappenplan voor eigenaarschap, processen en overdracht',
    proof_boundary: 'Algemene uitleg zonder claims over concrete klanten of opbrengsten'
  };
}

export async function generateOpenAIApprovedBlog({learning, date, apiKey, fetchImpl=fetch, model=MODEL}={}) {
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new Error('OPENAI_BLOG_KEY_UNAVAILABLE');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) throw new Error('OPENAI_BLOG_DATE_INVALID');
  if (!learning || typeof learning !== 'object' || Array.isArray(learning) ||
      !(learning.learning || learning.context || learning.candidate_scores || learning.exploit_candidates))
    throw new Error('OPENAI_BLOG_BRAIN_EVIDENCE_MISSING');
  const learningData = JSON.stringify(learning);
  if (learningData.length > 60_000) throw new Error('OPENAI_BLOG_BRAIN_EVIDENCE_OVERSIZED');
  const publicTopic = selectApprovedPublicTopic(learning);
  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {'authorization':'Bearer ' + apiKey, 'content-type':'application/json'},
      body: JSON.stringify({
        model, store: false, max_output_tokens: 9000,
        instructions: [
          'Schrijf precies één origineel Nederlandstalig blogartikel voor Bedrijfsgeheugen.nl.',
          'Het onderwerp komt uit een gesloten openbare redactionele keuzelijst. Interne BRAIN-bestanden en klantgegevens worden NIET meegestuurd.',
          'Prioriteer aantoonbaar order/omzet boven qualified leads en clicks. Gebruik nooit ongeverifieerde aantallen, claims, cases, testimonials of orders als feiten.',
          'Gebruik alleen het meegegeven algemene onderwerp en maak duidelijk dat er geen externe klant- of omzetevidentie is.',
          'Bied 900-1500 woorden, minstens twee ##-koppen, een concrete MKB-probleemstelling, werkbare stappen en een passende CTA voor Frisse Blik of Frisse Blik Scan.',
          'Geen holle AI-claims of keyword stuffing. Meta-omschrijving 120-170 tekens; titel 12-80 tekens; focuszoekwoord 3-80 tekens.',
          'Maak een unieke lowercase-kebab-case slug. Produceer uitsluitend het JSON-object volgens het schema.'
        ].join('\n'),
        input: JSON.stringify({business_date:date,approved_public_topic:publicTopic}),
        text: {format: {type:'json_schema',name:'approved_blog_candidate',strict:true,schema:SCHEMA}}
      }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('OPENAI_BLOG_HTTP_' + res.status);
    const payload = await res.json();
    let candidate;
    try {candidate = JSON.parse(responseText(payload));}
    catch (error) {
      if (String(error?.message || '').startsWith('OPENAI_')) throw error;
      throw new Error('OPENAI_BLOG_INVALID_JSON');
    }
    return validateApprovedBlogCandidate(candidate);
  } finally {
    clearTimeout(abort);
  }
}

async function main() {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  const date = String(process.env.BUSINESS_DATE || '').trim();
  const learning = JSON.parse(await readFile('tmp/brain-content-learning.json','utf8'));
  const candidate = await generateOpenAIApprovedBlog({learning,date,apiKey});
  const output = path.join('tmp','native-approved-blog.json');
  await mkdir(path.dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify(candidate,null,2)+'\n',{flag:'w'});
  console.log('OPENAI_APPROVED_BLOG_CANDIDATE_PREPARED',date,candidate.slug);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error('OPENAI_APPROVED_BLOG_FAILED',String(error?.message || error).slice(0,200));
    process.exitCode = 1;
  });
}
