import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

function onBlock(text) {
  const match = text.match(/^on:\s*\n([\s\S]*?)(?=^[A-Za-z_][A-Za-z0-9_-]*:\s*(?:#.*)?$|\Z)/m);
  return match?.[1] ?? '';
}

function eventBlock(block, eventName) {
  const lines = block.split(/\r?\n/);
  const start = lines.findIndex(line => new RegExp(`^\\s{2}${eventName}:`).test(line));
  if (start < 0) return '';
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s{2}[A-Za-z_][A-Za-z0-9_-]*:/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join('\n');
}

export async function inspectWorkflowTopology({ workflowDir, canonicalPrWorkflow }) {
  const entries = (await readdir(workflowDir)).filter(file => /\.ya?ml$/i.test(file)).sort();
  const workflows = [];
  for (const file of entries) {
    const text = await readFile(join(workflowDir, file), 'utf8');
    const block = onBlock(text);
    const pr = eventBlock(block, 'pull_request');
    workflows.push({
      file: basename(file),
      hasPullRequest: Boolean(pr),
      pullRequestScoped: Boolean(pr && /\n\s{4}(?:paths|paths-ignore):/.test(pr)),
      reusable: /^\s{2}workflow_call:/m.test(block),
      scheduled: /^\s{2}schedule:/m.test(block),
      push: /^\s{2}push:/m.test(block),
    });
  }
  return {
    canonicalPrWorkflow,
    workflows,
    broadPullRequestWorkflows: workflows.filter(w => w.hasPullRequest && !w.pullRequestScoped).map(w => w.file),
    scopedPullRequestWorkflows: workflows.filter(w => w.hasPullRequest && w.pullRequestScoped).map(w => w.file),
    reusableWorkflows: workflows.filter(w => w.reusable).map(w => w.file),
    scheduledWorkflows: workflows.filter(w => w.scheduled).map(w => w.file),
    pushWorkflows: workflows.filter(w => w.push).map(w => w.file),
  };
}

export function evaluateTopology(topology, policy) {
  const allowed = new Set(policy.allowedBroadPullRequestWorkflows ?? [policy.canonicalPrWorkflow]);
  const violations = [];
  for (const file of topology.broadPullRequestWorkflows) {
    if (!allowed.has(file)) violations.push(`unexpected broad pull_request workflow: ${file}`);
  }
  if (!topology.broadPullRequestWorkflows.includes(policy.canonicalPrWorkflow)) {
    violations.push(`canonical PR workflow missing broad pull_request trigger: ${policy.canonicalPrWorkflow}`);
  }
  if (topology.broadPullRequestWorkflows.length !== (policy.policy?.broadPrIngressCount ?? 1)) {
    violations.push(`broad pull_request ingress count is ${topology.broadPullRequestWorkflows.length}, expected ${policy.policy?.broadPrIngressCount ?? 1}`);
  }
  return { ok: violations.length === 0, violations };
}
