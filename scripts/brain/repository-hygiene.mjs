#!/usr/bin/env node
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function candidateFamily(pr, policy) {
  return policy.candidate_families.find(f => pr.title?.startsWith(f.title_prefix)) ?? null;
}

export function filesAreDiscardable(files, family) {
  const names = files.map(f => f.filename).sort();
  const allowed = [...family.discardable_files].sort();
  return names.length > 0 && names.every(name => allowed.includes(name));
}

export function isControlledWriterBranch(name, policy) {
  return policy.orphan_branch_cleanup_prefixes.some(prefix => name.startsWith(prefix));
}

export function mayDeleteOrphanBranch({ branch, openHeads, aheadBy, policy }) {
  if (!isControlledWriterBranch(branch, policy)) return false;
  if (openHeads.has(branch)) return false;
  if (policy.protected_prefixes.some(prefix => branch === prefix || branch.startsWith(prefix))) return false;
  return aheadBy === 0;
}

export function parseObligationLineage(pr = {}) {
  const body = String(pr.body ?? "");
  const obligationId = body.match(/^Obligation-ID:\s*(.+)$/mi)?.[1]?.trim() ?? "";
  const supersedesRaw = body.match(/^Supersedes:\s*(.+)$/mi)?.[1]?.trim() ?? "";
  const supersedes = /^\d+$/.test(supersedesRaw) ? Number(supersedesRaw) : null;
  return { obligationId, supersedes };
}

export function mayAutoCloseSupersededObligation({ predecessor, successor }) {
  if (!predecessor || !successor) return false;
  if (predecessor.state !== "open" || successor.state !== "open") return false;
  if (!(Number(successor.number) > Number(predecessor.number))) return false;
  const oldMeta = parseObligationLineage(predecessor);
  const newMeta = parseObligationLineage(successor);
  if (!oldMeta.obligationId || oldMeta.obligationId !== newMeta.obligationId) return false;
  return newMeta.supersedes === Number(predecessor.number);
}

export function cancellableWorkflowRuns(runs = []) {
  const cancellable = new Set(["queued", "in_progress", "waiting", "requested", "pending"]);
  return runs.filter(run => cancellable.has(String(run?.status ?? "")) && Number.isInteger(Number(run?.id)));
}

function apiBase(repo) {
  return `https://api.github.com/repos/${repo}`;
}

async function gh(path, { method = "GET", body } = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

async function paginate(path) {
  const rows = [];
  for (let page = 1; ; page += 1) {
    const join = path.includes("?") ? "&" : "?";
    const batch = await gh(`${path}${join}per_page=100&page=${page}`);
    rows.push(...batch);
    if (batch.length < 100) break;
  }
  return rows;
}

async function changedFiles(repo, number) {
  return paginate(`/repos/${repo}/pulls/${number}/files`);
}

async function compare(repo, base, head) {
  return gh(`/repos/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`);
}

async function closePr(repo, number) {
  return gh(`/repos/${repo}/pulls/${number}`, { method: "PATCH", body: { state: "closed" } });
}

async function cancelRunsForHead(repo, headSha, { remainingBudget }) {
  if (!headSha || remainingBudget <= 0) return { cancelled: 0, deferred: 0 };
  const payload = await gh(`/repos/${repo}/actions/runs?head_sha=${encodeURIComponent(headSha)}&per_page=100`);
  const runs = cancellableWorkflowRuns(payload?.workflow_runs ?? []);
  let cancelled = 0;
  for (const run of runs.slice(0, remainingBudget)) {
    try {
      await gh(`/repos/${repo}/actions/runs/${run.id}/cancel`, { method: "POST" });
      cancelled += 1;
    } catch (error) {
      // A run may become terminal between read and cancel. Preserve hygiene progress.
      if (!/-> (409|422):/.test(String(error?.message ?? error))) throw error;
    }
  }
  return { cancelled, deferred: Math.max(0, runs.length - remainingBudget) };
}

async function deleteBranch(repo, branch) {
  return gh(`/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, { method: "DELETE" });
}

export async function buildPlan({ repo, policy, apply = false }) {
  const openPrs = await paginate(`/repos/${repo}/pulls?state=open`);
  const branches = await paginate(`/repos/${repo}/branches`);
  const openHeads = new Set(openPrs.map(pr => pr.head?.ref).filter(Boolean));

  const families = new Map();
  for (const pr of openPrs) {
    const family = candidateFamily(pr, policy);
    if (!family) continue;
    const list = families.get(family.id) ?? [];
    list.push(pr);
    families.set(family.id, list);
  }

  const closedCandidates = [];
  const protectedCandidates = [];
  const deferredCandidates = [];
  const supersededObligationPrs = [];
  const protectedObligationPrs = [];
  const closedPrNumbers = new Set();
  const budget = policy.resource_budget ?? {};
  const maxCandidateClosures = Number(budget.max_candidate_closures_per_run ?? 25);
  const maxObligationSupersessions = Number(budget.max_obligation_supersessions_per_run ?? 25);
  const maxWorkflowCancels = Number(budget.max_workflow_cancels_per_run ?? 100);
  const maxBranchEvaluations = Number(budget.max_branch_evaluations_per_run ?? 200);
  let workflowCancels = 0;
  let deferredWorkflowCancels = 0;
  const maxBranchDeletes = Number(budget.max_branch_deletes_per_run ?? 100);

  const byNumber = new Map(openPrs.map(pr => [Number(pr.number), pr]));
  const successors = [...openPrs]
    .filter(pr => parseObligationLineage(pr).supersedes !== null)
    .sort((a, b) => Number(b.number) - Number(a.number));

  for (const successor of successors) {
    if (supersededObligationPrs.length >= maxObligationSupersessions) break;
    const { supersedes } = parseObligationLineage(successor);
    const predecessor = byNumber.get(Number(supersedes));
    if (!predecessor) continue;
    if (!mayAutoCloseSupersededObligation({ predecessor, successor })) {
      protectedObligationPrs.push({
        predecessor: predecessor.number,
        successor: successor.number,
        reason: "explicit-supersedes-contract-not-safe"
      });
      continue;
    }
    if (closedPrNumbers.has(Number(predecessor.number))) continue;
    const item = {
      obligation_id: parseObligationLineage(successor).obligationId,
      predecessor: predecessor.number,
      successor: successor.number,
      head: predecessor.head?.ref ?? null,
      reason: "explicit-same-obligation-supersession"
    };
    if (apply) {
      await closePr(repo, predecessor.number);
      const cancel = await cancelRunsForHead(repo, predecessor.head?.sha, { remainingBudget: Math.max(0, maxWorkflowCancels - workflowCancels) });
      workflowCancels += cancel.cancelled;
      deferredWorkflowCancels += cancel.deferred;
      item.workflow_runs_cancelled = cancel.cancelled;
      if (cancel.deferred) item.workflow_runs_deferred = cancel.deferred;
    }
    supersededObligationPrs.push(item);
    closedPrNumbers.add(Number(predecessor.number));
    openHeads.delete(predecessor.head?.ref);
  }
  for (const [familyId, prs] of families) {
    const sorted = prs.filter(pr => !closedPrNumbers.has(Number(pr.number))).sort((a, b) => b.number - a.number);
    if (!sorted.length) continue;
    const newest = sorted[0];
    protectedCandidates.push({ family: familyId, number: newest.number, reason: "newest-open-candidate" });
    for (const pr of sorted.slice(1)) {
      if (closedCandidates.length >= maxCandidateClosures) {
        deferredCandidates.push({ family: familyId, number: pr.number, reason: "resource-budget" });
        continue;
      }
      const family = candidateFamily(pr, policy);
      const files = await changedFiles(repo, pr.number);
      const isBot = pr.user?.login === "github-actions[bot]";
      const discardable = isBot && family.auto_close_when_superseded && filesAreDiscardable(files, family);
      if (!discardable) {
        protectedCandidates.push({ family: familyId, number: pr.number, reason: "contains-non-discardable-delta" });
        continue;
      }
      const item = { family: familyId, number: pr.number, head: pr.head.ref, files: files.map(f => f.filename) };
      if (apply) {
        await closePr(repo, pr.number);
        closedPrNumbers.add(Number(pr.number));
        const cancel = await cancelRunsForHead(repo, pr.head?.sha, { remainingBudget: Math.max(0, maxWorkflowCancels - workflowCancels) });
        workflowCancels += cancel.cancelled;
        deferredWorkflowCancels += cancel.deferred;
        item.workflow_runs_cancelled = cancel.cancelled;
        if (cancel.deferred) item.workflow_runs_deferred = cancel.deferred;
        if (pr.head?.ref?.startsWith(family.branch_prefix)) {
          await deleteBranch(repo, pr.head.ref);
          item.branch_deleted = true;
        }
      }
      closedCandidates.push(item);
      openHeads.delete(pr.head.ref);
    }
  }

  const orphanBranches = [];
  const retainedUniqueBranches = [];
  const deferredOrphanBranches = [];
  let branchEvaluations = 0;
  let branchDeletes = 0;
  for (const b of branches) {
    const name = b.name;
    if (!isControlledWriterBranch(name, policy) || openHeads.has(name)) continue;
    if (branchEvaluations >= maxBranchEvaluations) {
      deferredOrphanBranches.push({ branch: name, reason: "evaluation-budget" });
      continue;
    }
    branchEvaluations += 1;
    const cmp = await compare(repo, policy.default_branch, name);
    if (mayDeleteOrphanBranch({ branch: name, openHeads, aheadBy: cmp.ahead_by, policy })) {
      const item = { branch: name, ahead_by: cmp.ahead_by, behind_by: cmp.behind_by };
      if (apply && branchDeletes < maxBranchDeletes) {
        await deleteBranch(repo, name);
        item.deleted = true;
        branchDeletes += 1;
      } else if (apply) {
        item.deferred = "delete-budget";
      }
      orphanBranches.push(item);
    } else {
      retainedUniqueBranches.push({ branch: name, ahead_by: cmp.ahead_by, behind_by: cmp.behind_by });
    }
  }

  const report = {
    version: policy.version,
    mode: apply ? "apply" : "audit",
    repository: repo,
    generated_at: new Date().toISOString(),
    totals: {
      branches_before: branches.length,
      open_prs_before: openPrs.length,
      superseded_candidates: closedCandidates.length,
      superseded_obligation_prs: supersededObligationPrs.length,
      removable_orphan_writer_branches: orphanBranches.length,
      retained_unique_writer_branches: retainedUniqueBranches.length,
      deferred_candidates: deferredCandidates.length,
      deferred_orphan_writer_branches: deferredOrphanBranches.length,
      branch_evaluations: branchEvaluations,
      branch_deletes: branchDeletes,
      workflow_runs_cancelled: workflowCancels,
      workflow_runs_deferred: deferredWorkflowCancels
    },
    thresholds: {
      warning: policy.branch_warning_threshold,
      hard: policy.branch_hard_threshold,
      warning_exceeded: branches.length > policy.branch_warning_threshold,
      hard_exceeded: branches.length > policy.branch_hard_threshold
    },
    resource_budget: {
      max_candidate_closures_per_run: maxCandidateClosures,
      max_obligation_supersessions_per_run: maxObligationSupersessions,
      max_workflow_cancels_per_run: maxWorkflowCancels,
      max_branch_evaluations_per_run: maxBranchEvaluations,
      max_branch_deletes_per_run: maxBranchDeletes
    },
    superseded_obligation_prs: supersededObligationPrs,
    protected_obligation_prs: protectedObligationPrs,
    closed_candidates: closedCandidates,
    protected_candidates: protectedCandidates,
    deferred_candidates: deferredCandidates,
    removable_orphan_writer_branches: orphanBranches,
    retained_unique_writer_branches: retainedUniqueBranches,
    deferred_orphan_writer_branches: deferredOrphanBranches
  };

  return report;
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error("GITHUB_REPOSITORY is required");
  const policyPath = process.env.HYGIENE_POLICY ?? "config/repository-hygiene-policy.json";
  const output = process.env.HYGIENE_OUTPUT ?? "repository-hygiene-report.json";
  const policy = JSON.parse(await fs.readFile(policyPath, "utf8"));
  const apply = (process.env.HYGIENE_MODE ?? "audit") === "apply";
  const report = await buildPlan({ repo, policy, apply });
  await fs.writeFile(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.totals));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}
