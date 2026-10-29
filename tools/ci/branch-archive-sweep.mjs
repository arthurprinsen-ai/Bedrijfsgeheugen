#!/usr/bin/env node
// Bounded, evidence-first removal of stale branches whose work stays recoverable.
//
// A branch is removed only when ONE of these holds:
//   MERGED_EXACT_HEAD       a merged PR had exactly this head sha
//   CLOSED_PR_HEAD_KEPT     a closed PR had exactly this head sha (GitHub keeps refs/pull/N/head)
//   CONTAINED_IN_MAIN       the branch has zero commits ahead of main
//   ARCHIVED_THEN_REMOVED   it has unique commits: an archive/<name> tag is created and read back first
// Never touched: main, archive/, release/, hotfix/, protected refs, branches with an open PR,
// branches whose newest commit is younger than the minimum age, or any branch whose head moved.
// Only the repository named by GITHUB_REPOSITORY is addressed.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const PROTECTED_PREFIXES = ['archive/', 'release/', 'hotfix/'];
export const MIN_AGE_DAYS_CLOSED_PR_HEAD = 1;
export const MIN_AGE_DAYS_UNIQUE_WORK = 3;

export function indexPullRequests(prs, repo) {
  const byHead = new Map();
  for (const pr of prs) {
    const headRepo = String(pr.head?.repo?.full_name || '').toLowerCase();
    if (headRepo !== String(repo).toLowerCase()) continue; // fork or foreign heads never count
    const list = byHead.get(pr.head.ref) || [];
    list.push(pr);
    byHead.set(pr.head.ref, list);
  }
  return byHead;
}

export function classifyBranch(branch, prsByHead) {
  const { name, sha } = branch;
  if (name === 'main' || PROTECTED_PREFIXES.some((p) => name.startsWith(p))) return { skip: 'RESERVED' };
  if (branch.protected === true) return { skip: 'PROTECTED' };
  const prs = prsByHead.get(name) || [];
  if (prs.some((pr) => pr.state === 'open')) return { skip: 'OPEN_PR' };
  if (prs.some((pr) => pr.merged_at && pr.head.sha === sha)) return { kind: 'MERGED_EXACT_HEAD', minAgeDays: 0 };
  if (prs.some((pr) => !pr.merged_at && pr.head.sha === sha)) return { kind: 'CLOSED_PR_HEAD_KEPT', minAgeDays: MIN_AGE_DAYS_CLOSED_PR_HEAD };
  return { kind: 'UNIQUE_OR_CONTAINED', minAgeDays: 0 };
}

export function decide(cls, { aheadBy, ageDays }) {
  if (cls.skip) return { action: 'SKIP', reason: cls.skip };
  if (cls.kind === 'MERGED_EXACT_HEAD') return { action: 'DELETE', reason: cls.kind };
  if (cls.kind === 'CLOSED_PR_HEAD_KEPT') {
    return ageDays >= cls.minAgeDays ? { action: 'DELETE', reason: cls.kind } : { action: 'SKIP', reason: 'TOO_YOUNG' };
  }
  if (aheadBy === 0) return { action: 'DELETE', reason: 'CONTAINED_IN_MAIN' };
  if (!Number.isInteger(aheadBy)) return { action: 'SKIP', reason: 'AHEAD_UNPROVEN' };
  if (ageDays < MIN_AGE_DAYS_UNIQUE_WORK) return { action: 'SKIP', reason: 'TOO_YOUNG' };
  return { action: 'ARCHIVE_THEN_DELETE', reason: 'ARCHIVED_THEN_REMOVED' };
}

export function archiveTagName(branch, sha, existingTagSha) {
  const base = `archive/${branch}`;
  return existingTagSha && existingTagSha !== sha ? `${base}-${sha.slice(0, 7)}` : base;
}

function gh(args, { input, allow404 = false } = {}) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', input, maxBuffer: 256 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (error) {
    if (allow404 && /404|Not Found/.test(String(error.stderr || error.message))) return null;
    throw error;
  }
}

function pages(repo, path, params) {
  const all = [];
  for (let page = 1; page <= 80; page += 1) {
    const out = JSON.parse(gh(['api', '-X', 'GET', `repos/${repo}/${path}`, '-f', 'per_page=100', '-f', `page=${page}`, ...params]));
    all.push(...out);
    if (out.length < 100) break;
  }
  return all;
}

export function main(argv = process.argv.slice(2), env = process.env) {
  const repo = env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GITHUB_REPOSITORY is required');
  const apply = argv.includes('--apply');
  const cap = Number(argv[argv.indexOf('--cap') + 1]) || 150;
  const actionsFile = argv.includes('--actions') ? argv[argv.indexOf('--actions') + 1] : null;
  const prsByHead = indexPullRequests(pages(repo, 'pulls', ['-f', 'state=all']), repo);
  const branches = pages(repo, 'branches', []).map((b) => ({ name: b.name, sha: b.commit.sha, protected: b.protected === true }));
  const counts = { seen: 0, skipped: 0, deleted: 0, archived: 0, drift: 0, failed: 0 };
  const now = Date.now();
  const deadline = now + (Number(env.SWEEP_BUDGET_SECONDS) || 360) * 1000;
  let consecutiveArchiveFailures = 0;
  for (const branch of branches) {
    if (counts.deleted >= cap || Date.now() > deadline) break;
    counts.seen += 1;
    const cls = classifyBranch(branch, prsByHead);
    if (cls.skip) { counts.skipped += 1; continue; }
    const enc = encodeURIComponent(branch.name);
    let ageDays = 0;
    let aheadBy;
    if (cls.kind !== 'MERGED_EXACT_HEAD') {
      const commit = JSON.parse(gh(['api', `repos/${repo}/commits/${branch.sha}`]));
      ageDays = (now - Date.parse(commit.commit.committer.date)) / 86400000;
    }
    if (cls.kind === 'UNIQUE_OR_CONTAINED') {
      const cmp = gh(['api', `repos/${repo}/compare/main...${enc}`, '--jq', '.ahead_by'], { allow404: true });
      aheadBy = cmp === null ? undefined : Number(cmp.trim());
    }
    const verdict = decide(cls, { aheadBy, ageDays });
    if (verdict.action === 'SKIP') { counts.skipped += 1; continue; }
    // Circuit breaker: if archive tags cannot be written, never fall back to deleting unique work.
    if (verdict.action === 'ARCHIVE_THEN_DELETE' && consecutiveArchiveFailures >= 3) { counts.skipped += 1; continue; }
    if (!apply) { console.log(`DRY ${verdict.action} ${branch.name} ${verdict.reason}`); counts.deleted += 1; continue; }
    try {
      const head = gh(['api', `repos/${repo}/git/ref/heads/${enc}`, '--jq', '.object.sha'], { allow404: true });
      if (!head || head.trim() !== branch.sha) { counts.drift += 1; continue; }
      let tag = null;
      if (verdict.action === 'ARCHIVE_THEN_DELETE') {
        const existing = gh(['api', `repos/${repo}/git/ref/tags/archive/${enc.replace(/%2F/g, '/')}`, '--jq', '.object.sha'], { allow404: true });
        tag = archiveTagName(branch.name, branch.sha, existing && existing.trim());
        if (!existing || existing.trim() !== branch.sha) {
          gh(['api', '-X', 'POST', `repos/${repo}/git/refs`, '-f', `ref=refs/tags/${tag}`, '-f', `sha=${branch.sha}`]);
        }
        const readback = gh(['api', `repos/${repo}/git/ref/tags/${tag}`, '--jq', '.object.sha']).trim();
        if (readback !== branch.sha) throw new Error(`ARCHIVE_READBACK_MISMATCH:${tag}`);
        counts.archived += 1;
        consecutiveArchiveFailures = 0;
      }
      gh(['api', '-X', 'DELETE', `repos/${repo}/git/refs/heads/${enc}`]);
      counts.deleted += 1;
      if (actionsFile) {
        appendFileSync(actionsFile, `${JSON.stringify({ type: 'DELETE_BRANCH', branch: branch.name, head_sha: branch.sha, reason: verdict.reason, archive_tag: tag })}\n`);
      }
    } catch (error) {
      counts.failed += 1;
      if (verdict.action === 'ARCHIVE_THEN_DELETE') consecutiveArchiveFailures += 1;
      const detail = `${String(error.stdout || '').trim()} ${String(error.stderr || '').trim()}`.replace(/\s+/g, ' ').slice(0, 300) || String(error.message).split('\n')[0];
      console.log(`::warning::JANITOR_ARCHIVE_SWEEP_FAILED:${branch.name}:${detail}`);
    }
  }
  console.log(`JANITOR_ARCHIVE_SWEEP:apply=${apply}:cap=${cap}:seen=${counts.seen}:skipped=${counts.skipped}:archived=${counts.archived}:deleted=${counts.deleted}:drift=${counts.drift}:failed=${counts.failed}`);
  return counts;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
