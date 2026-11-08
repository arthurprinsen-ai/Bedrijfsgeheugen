/**
 * Trusted skill loader: issues the loader receipt and manifest entry that
 * agent-skill-execution-evidence.mjs requires, derived from the skill's
 * actual bytes in the repository, never from an agent's own claim.
 *
 * Pure and read-only: no scheduler, no network, no database write.
 * It does NOT verify that a skill was applied and it is NOT the independent
 * verifier; it only proves which exact skill text was loaded for which run.
 */
import { readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { sha256 } from './agent-skill-execution-evidence.mjs';

export const TRUSTED_LOADER_ID = 'trusted-skill-loader';
export const TRUSTED_SKILL_LOADER_CONTRACT = 'trusted-skill-loader-v1';

const SKILL_ID = /^[a-z0-9][a-z0-9._-]{0,120}$/;
const RUN_OR_AGENT_ID = /^[a-zA-Z0-9._:/-]{1,180}$/;

function skillPath(repoRoot, skillId) {
  const root = resolve(repoRoot);
  const path = resolve(root, '.agents', 'skills', skillId, 'SKILL.md');
  if (!path.startsWith(root + sep + '.agents' + sep + 'skills' + sep)) return null;
  return path;
}

export function loadTrustedSkill({ repoRoot, skillId, runId, agentId, now = new Date() } = {}) {
  if (!repoRoot || !SKILL_ID.test(String(skillId ?? ''))) return { ok: false, error: 'SKILL_ID_INVALID' };
  if (!RUN_OR_AGENT_ID.test(String(runId ?? '')) || !RUN_OR_AGENT_ID.test(String(agentId ?? ''))) {
    return { ok: false, error: 'RUN_IDENTITY_INVALID' };
  }
  const loadedAt = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(loadedAt.getTime())) return { ok: false, error: 'LOADED_AT_INVALID' };
  const path = skillPath(repoRoot, skillId);
  if (!path) return { ok: false, error: 'SKILL_PATH_ESCAPES_ROOT' };
  let text;
  try { text = readFileSync(path, 'utf8'); } catch { return { ok: false, error: 'SKILL_NOT_FOUND' }; }
  if (!text.trim()) return { ok: false, error: 'SKILL_EMPTY' };
  const contentSha256 = sha256(text);
  const version = `content-${contentSha256.slice(0, 12)}`;
  return {
    ok: true,
    contract: TRUSTED_SKILL_LOADER_CONTRACT,
    manifestEntry: { id: skillId, version, contentSha256 },
    receipt: {
      runId, agentId, skillId, version, contentSha256,
      loaded: true, loaderId: TRUSTED_LOADER_ID, loadedAt: loadedAt.toISOString()
    }
  };
}

export function loadTrustedSkills({ repoRoot, skillIds, runId, agentId, now } = {}) {
  const ids = Array.isArray(skillIds) ? skillIds : [];
  if (!ids.length || new Set(ids).size !== ids.length) return { ok: false, error: 'SKILL_IDS_INVALID' };
  const results = ids.map((skillId) => loadTrustedSkill({ repoRoot, skillId, runId, agentId, now }));
  const failed = results.find((r) => !r.ok);
  if (failed) return { ok: false, error: failed.error };
  return {
    ok: true,
    manifest: { requiredSkills: results.map((r) => r.manifestEntry) },
    loaderReceipts: results.map((r) => r.receipt)
  };
}
