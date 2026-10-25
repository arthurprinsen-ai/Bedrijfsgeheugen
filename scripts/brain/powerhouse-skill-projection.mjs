import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const SKILL_PROJECTION_FINGERPRINT = 'powerhouse-learning-skill-auto-projection-v1';
export const SKILL_INDEX_VERSION = 'POWERHOUSE-LEARNING-SKILL-INDEX-v1';

const TARGET_RULES = [
  ['delivery', /delivery|deploy|github|branch|merge|ci|writer|lease|promotion|release|migration/i],
  ['social', /instagram|linkedin|social|content|publisher|media|mira|buffer/i],
  ['portal', /portal|canvas|customer|tenant|strategy|execution ladder/i],
  ['data', /data|analytics|evidence|source|supabase|database|schema|connector|search|seo/i],
  ['foresight', /foresight|forecast|predict|calibrat|experiment|future|autonom/i],
  ['security', /security|secret|permission|rls|auth|least privilege|privacy/i],
  ['continuity', /continuity|learning|memory|agent|chat|skill|preflight|writeback|recovery/i]
];

const TASK_INTENT_TARGET_RULES = Object.freeze([
  ['delivery', /\b(?:github|gitops|ci|deployment|deploy|release|merge|codeql|productie|livegang|preview|migratie)\b/i],
  ['social', /\b(?:instagram|linkedin|mira|social|reels?|posts?|video|publicatie|publiceren|publish(?:ing)?)\b/i],
  ['portal', /\b(?:portaal|portal|dashboard|tenant|klantportaal)\b/i],
  ['data', /\b(?:data|analytics|metingen?|seo|supabase|database|bronnen|brondata|evidence)\b/i],
  ['foresight', /\b(?:innovatie(?:s)?|innovation|experiment(?:en)?|prediction|predictive|voorspellend|ai.modellen?|modelcatalogus)\b/i],
  ['security', /\b(?:beveiliging|security|privacy|toestemming|consent|auth|identity|codeql)\b/i],
  ['continuity', /\b(?:agents?|skills?|leren|learning|geheugen|memory|borging|borgen|vastleggen|logging|logboek|documentatie|incidenten?|continuity|preflight)\b/i]
]);
// Intent is an untrusted retrieval hint, never authority to deploy, send or override gates.
export function inferSkillTargetsFromIntent(intent) {
  if (typeof intent !== 'string' || !intent.trim()) return [];
  return stableUnique(TASK_INTENT_TARGET_RULES
    .filter(([, expression]) => expression.test(intent.slice(0, 2048)))
    .map(([target]) => target));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableUnique(values) {
  return [...new Set(values.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()))].sort();
}

function walkJson(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...walkJson(absolute));
    else if (item.isFile() && item.name.endsWith('.json')) out.push(absolute);
  }
  return out.sort();
}

function strings(value) {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap(strings);
  return [];
}

function collectPrevention(record) {
  return stableUnique([
    ...strings(record.prevention),
    ...strings(record.prevent),
    ...strings(record.prevention_rule),
    ...strings(record.prevention_rules),
    ...strings(record.preventions),
    ...strings(record.requiredAction),
    ...strings(record.required_action),
    ...strings(record.required_behavior),
    ...strings(record.rules),
    ...strings(record.fix)
  ]);
}

function inferTargets(record, relativePath) {
  const explicit = stableUnique([
    ...strings(record.skill_targets),
    ...strings(record.skillTargets),
    ...strings(record.target_skills)
  ]);
  if (explicit.length) return explicit;
  const haystack = JSON.stringify({
    relativePath,
    fingerprint: record.fingerprint,
    type: record.type,
    version: record.version,
    problem: record.problem,
    rootCause: record.rootCause,
    prevention: collectPrevention(record)
  });
  const inferred = TARGET_RULES.filter(([, re]) => re.test(haystack)).map(([target]) => target);
  return stableUnique(inferred.length ? inferred : ['continuity']);
}

function normalizedLearning(record, relativePath) {
  const fingerprint = typeof record?.fingerprint === 'string' ? record.fingerprint.trim() : '';
  if (!fingerprint) return null;
  const prevention = collectPrevention(record);
  if (!prevention.length) return null;
  return {
    fingerprint,
    status: typeof record.status === 'string' ? record.status : 'UNKNOWN',
    skill_targets: inferTargets(record, relativePath),
    prevention,
    source: relativePath.replaceAll('\\', '/'),
    source_revision: Number(record.revision ?? record.version_revision ?? 1) || 1,
    ...(record?.mandatory_preflight === true && record?.compiler?.scope === 'ALL_POWERHOUSE_AGENTS_CHATS' && record?.compiler?.machine_enforceable === true
      ? { mandatory_preflight: true } : {})
  };
}

export function buildSkillProjectionIndex({ rootDir = process.cwd() } = {}) {
  const learningDir = path.join(rootDir, 'brain', 'learning');
  const grouped = new Map();

  for (const absolute of walkJson(learningDir)) {
    const relative = path.relative(rootDir, absolute).replaceAll('\\', '/');
    let parsed;
    try { parsed = JSON.parse(fs.readFileSync(absolute, 'utf8')); }
    catch (error) { throw new Error(`SKILL_PROJECTION_INVALID_JSON:${relative}:${error.message}`); }
    const normalized = normalizedLearning(parsed, relative);
    if (!normalized) continue;
    const current = grouped.get(normalized.fingerprint) ?? {
      fingerprint: normalized.fingerprint,
      status: normalized.status,
      skill_targets: [],
      prevention: [],
      sources: [],
      source_revision: 1
    };
    current.status = normalized.status;
    if (normalized.mandatory_preflight === true) current.mandatory_preflight = true;
    current.skill_targets = stableUnique([...current.skill_targets, ...normalized.skill_targets]);
    current.prevention = stableUnique([...current.prevention, ...normalized.prevention]);
    current.sources = stableUnique([...current.sources, normalized.source]);
    current.source_revision = Math.max(current.source_revision, normalized.source_revision);
    grouped.set(normalized.fingerprint, current);
  }

  const entries = [...grouped.values()].sort((a, b) => a.fingerprint.localeCompare(b.fingerprint)).map(entry => {
    const canonical = JSON.stringify({
      fingerprint: entry.fingerprint,
      status: entry.status,
      skill_targets: entry.skill_targets,
      prevention: entry.prevention,
      sources: entry.sources,
      source_revision: entry.source_revision,
      ...(entry.mandatory_preflight === true ? { mandatory_preflight: true } : {})
    });
    return { ...entry, source_digest: sha256(canonical) };
  });

  const projectionDigest = sha256(JSON.stringify(entries));
  return {
    type: 'POWERHOUSE_LEARNING_SKILL_INDEX',
    version: SKILL_INDEX_VERSION,
    fingerprint: SKILL_PROJECTION_FINGERPRINT,
    authority: 'CANONICAL_LEARNING_PROJECTED_NOT_PARALLEL_TRUTH',
    generated_from: 'brain/learning/**/*.json',
    generated_at_policy: 'RUNTIME_DETERMINISTIC_NO_WALLCLOCK_IN_DIGEST',
    entry_count: entries.length,
    projection_digest: projectionDigest,
    entries
  };
}

export function verifySkillProjectionIndex({ rootDir = process.cwd(), index } = {}) {
  const expected = buildSkillProjectionIndex({ rootDir });
  const actual = index ?? expected;
  const expectedByFingerprint = new Map(expected.entries.map(entry => [entry.fingerprint, entry]));
  const actualByFingerprint = new Map((actual.entries ?? []).map(entry => [entry.fingerprint, entry]));
  const drift = [];

  for (const [fingerprint, expectedEntry] of expectedByFingerprint) {
    const actualEntry = actualByFingerprint.get(fingerprint);
    if (!actualEntry) {
      drift.push({ fingerprint, reason: 'MISSING_SKILL_PROJECTION' });
      continue;
    }
    if (actualEntry.source_digest !== expectedEntry.source_digest) {
      drift.push({ fingerprint, reason: 'STALE_SKILL_PROJECTION', expected: expectedEntry.source_digest, actual: actualEntry.source_digest });
    }
  }
  for (const fingerprint of actualByFingerprint.keys()) {
    if (!expectedByFingerprint.has(fingerprint)) drift.push({ fingerprint, reason: 'ORPHANED_SKILL_PROJECTION' });
  }

  return {
    ok: drift.length === 0,
    fingerprint: SKILL_PROJECTION_FINGERPRINT,
    expected_entry_count: expected.entries.length,
    actual_entry_count: actual.entries?.length ?? 0,
    expected_projection_digest: expected.projection_digest,
    actual_projection_digest: actual.projection_digest ?? sha256(JSON.stringify(actual.entries ?? [])),
    drift
  };
}

export function selectSkillProjection(index, { fingerprints = [], targets = [], intent = '', maxEntries = null } = {}) {
  const wantedFingerprints = new Set(stableUnique(fingerprints));
  const inferredTargets = inferSkillTargetsFromIntent(intent);
  const wantedTargets = new Set(stableUnique([...targets, ...inferredTargets]));
  const hasHints = wantedFingerprints.size > 0 || wantedTargets.size > 0;
  const matching = (index.entries ?? []).filter(entry => {
    if (entry.mandatory_preflight === true) return true;
    if (!hasHints) return false;
    if (wantedFingerprints.has(entry.fingerprint)) return true;
    return (entry.skill_targets ?? []).some(target => wantedTargets.has(target));
  });
  let selected = matching;
  if (Number.isInteger(maxEntries) && maxEntries > 0) {
    const mandatory = matching.filter(entry => entry.mandatory_preflight === true);
    const exact = matching.filter(entry => entry.mandatory_preflight !== true && wantedFingerprints.has(entry.fingerprint));
    const other = matching
      .filter(entry => entry.mandatory_preflight !== true && !wantedFingerprints.has(entry.fingerprint))
      .sort((a, b) => {
        const recentB = (b.sources ?? []).at(-1) ?? '';
        const recentA = (a.sources ?? []).at(-1) ?? '';
        return recentB.localeCompare(recentA) || a.fingerprint.localeCompare(b.fingerprint);
      });
    // Mandatory rules and exact requests cannot be lost to the retrieval budget.
    selected = [...mandatory, ...exact,
      ...other.slice(0, Math.max(0, maxEntries - mandatory.length - exact.length))];
  }
  return {
    fingerprint: SKILL_PROJECTION_FINGERPRINT,
    projection_digest: index.projection_digest,
    total_entries: index.entry_count ?? index.entries?.length ?? 0,
    selection_mode: hasHints ? 'TASK_RELEVANT_WITH_MANDATORY_BASELINE' : 'MANDATORY_BASELINE_NO_TASK_HINTS',
    inferred_targets: inferredTargets,
    matched_count: matching.length,
    truncated_count: matching.length - selected.length,
    selected_entries: selected
  };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const index = buildSkillProjectionIndex({ rootDir: process.cwd() });
    const verification = verifySkillProjectionIndex({ rootDir: process.cwd(), index });
    if (!verification.ok) throw new Error(`SKILL_PROJECTION_DRIFT:${JSON.stringify(verification.drift)}`);
    process.stdout.write(`${JSON.stringify({ status: 'SKILL_PROJECTION_READY', ...verification, projection_digest: index.projection_digest }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`SKILL_PROJECTION_FAILED: ${error.message}\n`);
    process.exitCode = 1;
  }
}
