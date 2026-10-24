import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DOMAIN = 'https://www.bedrijfsgeheugen.nl';
const TEST = 'tests/brain-daily-blog-proof-bundle-v1.test.mjs';

export function writeDailyBlogProofBundle({ date, artifact, root = process.cwd() }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) {
    throw new Error('BLOG_PROOF_INVALID_DATE');
  }
  const slug = String(artifact?.slug || '');
  const contentId = String(artifact?.content_id || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !contentId || contentId.length > 256) {
    throw new Error('BLOG_PROOF_INVALID_ARTIFACT');
  }
  let canonical;
  try { canonical = new URL(String(artifact?.canonical_url || '')); }
  catch { throw new Error('BLOG_PROOF_INVALID_CANONICAL'); }
  if (canonical.origin !== DOMAIN || canonical.pathname !== '/blog/' + slug + '/' || canonical.search || canonical.hash) {
    throw new Error('BLOG_PROOF_INVALID_CANONICAL');
  }
  if (artifact.ok !== true) throw new Error('BLOG_PROOF_UNAPPROVED_RENDER');
  const proof = crypto.createHash('sha256').update(JSON.stringify({date, slug, contentId, canonical: canonical.href})).digest('hex');
  const base = 'powerhouse-blog-' + date;
  const learningPath = 'brain/learning/' + base + '.json';
  const ledgerPath = 'docs/development-ledger-events/' + base + '.md';
  const changePath = 'docs/changes/' + base + '.md';
  const learning = {
    type: 'POWERHOUSE_LEARNING',
    version: 'v1',
    date,
    fingerprint: 'content-publication|blog|' + date + '|source-and-outcome-proof-v1',
    obligation_id: 'content-publication:' + date + ':blog',
    status: 'CANDIDATE',
    failure_class: 'BLOG_SOURCE_TO_LIVE_PROOF_GAP',
    root_cause: 'A source-backed rendered page is a publication candidate, not proof of protected merge, live URL, traffic, leads or revenue. The daily writer must preserve this distinction until independent readback.',
    observed_evidence: {
      source: 'canonical Supabase powerhouse_content_artifacts via powerhouse-blog-export',
      business_date: date,
      content_id: contentId,
      canonical_url: canonical.href,
      source_artifact_digest: proof,
      publication_state: 'NOT_YET_LIVE_VERIFIED'
    },
    fix: 'Carry durable source-backed Brain learning, append-only development activity and human-readable documentation with this exact daily candidate. Hand off to existing protected Required/CodeQL and live readback.',
    prevention_rule: 'Do not merge a material daily publication candidate without all three closure artifacts. Keep one writer per date and never label prepared content as published, live or monetized without independent production and attribution evidence.',
    tests: [TEST, 'tests/brain-material-writeback-closure-guard.test.mjs'],
    compiler: { failure_class: 'BLOG_SOURCE_TO_LIVE_PROOF_GAP', scope: 'CONTENT_PUBLICATION', machine_enforceable: true, repeat_count: 1, security_sensitive: false },
    evaluation: { historical_replay: [TEST], shadow: [TEST], canary: [TEST] },
    terminal_rule: 'Required/CodeQL exact-head success, protected merge, exact merged Netlify deploy, canonical public readback and recorded outcome are separately required.'
  };
  const ledger = [
    '# Daily blog candidate ' + date,
    '',
    '- Obligation: content-publication:' + date + ':blog',
    '- Owner: existing Powerhouse Daily Publisher; no independent scheduler or writer.',
    '- Source: canonical Supabase powerhouse_content_artifacts via powerhouse-blog-export.',
    '- Content ID: ' + contentId,
    '- Intended URL: ' + canonical.href,
    '- SHA-256 source-artifact identity: ' + proof,
    '- Current evidence: rendered candidate only; live publication, conversions and revenue not yet proven.',
    '- Required next action: exact-head Required + CodeQL, protected merge, production deployment and independent provider/public readback.',
    '- Prevention: generate the Brain, ledger and change records atomically with every material dated blog candidate.',
    ''
  ].join('\n');
  const change = [
    '# Powerhouse blog — source and publication evidence (' + date + ')',
    '',
    'The existing daily publisher prepared a canonical blog candidate for ' + canonical.href + ' from Supabase content artifact ' + contentId + '.',
    '',
    'This source-backed closure bundle records what is currently established. Rendering a candidate is not proof of live publication, Google indexing, visitor conversions or revenue. Those outcomes require independent readback and later measurement.',
    '',
    'The daily publisher retains one obligation owner, preserves reviewed translations and uses protected Required/CodeQL and Netlify release checks. No extra scheduler, alternative publication provider, invented proof or unsafe bypass is added.',
    ''
  ].join('\n');
  const written = [];
  for (const [relative, content] of [[learningPath, JSON.stringify(learning, null, 2) + '\n'], [ledgerPath, ledger], [changePath, change]]) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target)) {
      if (fs.readFileSync(target, 'utf8') !== content) throw new Error('BLOG_PROOF_EXISTING_EVIDENCE_MISMATCH:' + relative);
    } else {
      fs.writeFileSync(target, content, { flag: 'wx' });
    }
    written.push(relative);
  }
  return { status: 'CANDIDATE_NOT_LIVE_VERIFIED', files: written, fingerprint: learning.fingerprint };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try {
    const [date, artifactPath] = process.argv.slice(2);
    if (!date || !artifactPath) throw new Error('USAGE: daily-blog-proof-bundle.mjs YYYY-MM-DD artifact.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    console.log(JSON.stringify(writeDailyBlogProofBundle({ date, artifact })));
  } catch (error) {
    console.error(String(error?.message || error));
    process.exitCode = 1;
  }
}
