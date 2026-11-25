#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { inventoryWorkflowDirectory } from "./inventory-workflow-triggers.mjs";

const root = process.cwd();
const cfg = JSON.parse(fs.readFileSync(path.join(root, "config/control-plane-budget.json"), "utf8"));
const workflowDir = path.join(root, ".github/workflows");
const workflowFiles = fs.existsSync(workflowDir)
  ? fs.readdirSync(workflowDir).filter((name) => /\.ya?ml$/i.test(name)).length
  : 0;

const workflowInventory = inventoryWorkflowDirectory(workflowDir);
const directPrTriggerCount = workflowInventory.filter((item) => item.topLevelPrTrigger).length;
const directPrAdmissionCount = workflowInventory.filter((item) => item.prAdmissionTrigger).length;
const lifecyclePrAuthorityCount = workflowInventory.filter((item) => item.prLifecycleOnly).length;
const current = { github: { workflowFiles, directPrTriggerCount, directPrAdmissionCount, lifecyclePrAuthorityCount } };
const regressions = [];

if (workflowFiles > cfg.baseline.github.workflowFiles) {
  regressions.push({
    metric: "github.workflowFiles",
    baseline: cfg.baseline.github.workflowFiles,
    current: workflowFiles,
    target: cfg.budgets.github.maxTopLevelTriggeredWorkflows
  });
}

for (const [metric, currentValue, baselineValue, target] of [
  ["github.directPrTriggerCount", directPrTriggerCount, cfg.baseline.github.directPrTriggerCount, cfg.budgets.github.maxDirectPrTriggerWorkflows],
  ["github.directPrAdmissionCount", directPrAdmissionCount, cfg.baseline.github.directPrAdmissionCount, cfg.budgets.github.maxDirectPrAdmissionWorkflows],
  ["github.lifecyclePrAuthorityCount", lifecyclePrAuthorityCount, cfg.baseline.github.lifecyclePrAuthorityCount, cfg.budgets.github.maxLifecyclePrAuthorityWorkflows]
]) {
  if (currentValue > baselineValue || currentValue > target) {
    regressions.push({ metric, baseline: baselineValue, current: currentValue, target });
  }
}

const report = {
  schema_version: 1,
  mode: cfg.mode,
  generated_at: new Date().toISOString(),
  current,
  baseline: cfg.baseline,
  budgets: cfg.budgets,
  regressions,
  status: regressions.length ? "fail" : "pass"
};

fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/control-plane-budget.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (regressions.length) process.exit(1);
