#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventoryWorkflowDirectory } from './inventory-workflow-triggers.mjs';

export function evaluatePrTriggerRatchet({ workflowDir, baselineNames, baselineAdmissionNames = null, baselineLifecycleNames = null }) {
  const inventory = inventoryWorkflowDirectory(workflowDir);
  const currentNames = inventory.filter(item => item.topLevelPrTrigger).map(item => item.name).sort();
  const currentAdmissionNames = inventory.filter(item => item.prAdmissionTrigger).map(item => item.name).sort();
  const currentLifecycleNames = inventory.filter(item => item.prLifecycleOnly).map(item => item.name).sort();
  const baseline = [...baselineNames].sort();
  const admissionBaseline = [...(baselineAdmissionNames ?? baseline)].sort();
  const lifecycleBaseline = [...(baselineLifecycleNames ?? [])].sort();
  const addedNames = currentNames.filter(name => !new Set(baseline).has(name));
  const addedAdmissionNames = currentAdmissionNames.filter(name => !new Set(admissionBaseline).has(name));
  const addedLifecycleNames = currentLifecycleNames.filter(name => !new Set(lifecycleBaseline).has(name));
  const status = (
    addedNames.length ||
    addedAdmissionNames.length ||
    addedLifecycleNames.length ||
    currentNames.length > baseline.length ||
    currentAdmissionNames.length > admissionBaseline.length ||
    (baselineLifecycleNames !== null && currentLifecycleNames.length > lifecycleBaseline.length)
  ) ? 'fail' : 'pass';
  return {
    status,
    currentNames,
    baselineNames: baseline,
    addedNames,
    currentAdmissionNames,
    baselineAdmissionNames: admissionBaseline,
    addedAdmissionNames,
    currentLifecycleNames,
    baselineLifecycleNames: lifecycleBaseline,
    addedLifecycleNames
  };
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const root = process.cwd();
  const config = JSON.parse(fs.readFileSync(path.join(root, 'config', 'pr-trigger-baseline.json'), 'utf8'));
  const result = evaluatePrTriggerRatchet({
    workflowDir: path.join(root, '.github', 'workflows'),
    baselineNames: config.directPullRequestWorkflows,
    baselineAdmissionNames: config.admissionPullRequestWorkflows,
    baselineLifecycleNames: config.lifecyclePullRequestWorkflows
  });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (result.status !== 'pass') process.exit(1);
}
