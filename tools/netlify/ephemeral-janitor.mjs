#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function evaluateDeletionEligibility(project, now = new Date()) {
  const blockers = [];
  if (!['EPHEMERAL', 'DELETE_CANDIDATE', 'ARCHIVE'].includes(project.classification)) blockers.push('protected-class');
  const expiry = project.expires_at ? new Date(project.expires_at) : null;
  if (!expiry || Number.isNaN(expiry.getTime()) || expiry > now) blockers.push('not-expired');
  if ((project.custom_domains ?? []).length) blockers.push('custom-domain');
  if (project.production_alias) blockers.push('production-alias');
  if (project.active_dependency) blockers.push('active-dependency');
  if ((project.open_pr_references ?? []).length) blockers.push('open-pr-reference');
  if ((project.release_contract_references ?? []).length) blockers.push('release-contract-reference');
  if (project.deletion_approved !== true) blockers.push('approval-required');
  return { deleteEligible: blockers.length === 0, blockers };
}

export function evaluateRegistry(registry, now = new Date()) {
  return registry.projects.map(project => ({
    id: project.id,
    name: project.name,
    classification: project.classification,
    ...evaluateDeletionEligibility(project, now),
  }));
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const root = process.cwd();
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'config', 'netlify-project-registry.json'), 'utf8'));
  const results = evaluateRegistry(registry);
  process.stdout.write(JSON.stringify({
    schema_version: 1,
    mode: 'dry-run',
    evaluated_at: new Date().toISOString(),
    delete_eligible: results.filter(item => item.deleteEligible),
    blocked: results.filter(item => !item.deleteEligible),
  }, null, 2) + '\n');
}
