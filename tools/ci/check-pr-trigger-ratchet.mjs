#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventoryWorkflowDirectory } from './inventory-workflow-triggers.mjs';

export function evaluatePrTriggerRatchet({ workflowDir, baselineNames }) {
  const currentNames = inventoryWorkflowDirectory(workflowDir)
    .filter(item => item.topLevelPrTrigger)
    .map(item => item.name)
    .sort();
  const baseline = [...baselineNames].sort();
  const baselineSet = new Set(baseline);
  const addedNames = currentNames.filter(name => !baselineSet.has(name));
  const status = addedNames.length || currentNames.length > baseline.length ? 'fail' : 'pass';
  return { status, currentNames, baselineNames: baseline, addedNames };
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const root = process.cwd();
  const config = JSON.parse(fs.readFileSync(path.join(root, 'config', 'pr-trigger-baseline.json'), 'utf8'));
  const result = evaluatePrTriggerRatchet({
    workflowDir: path.join(root, '.github', 'workflows'),
    baselineNames: config.directPullRequestWorkflows
  });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (result.status !== 'pass') process.exit(1);
}
