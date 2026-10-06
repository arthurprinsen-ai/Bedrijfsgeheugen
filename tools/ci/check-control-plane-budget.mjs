#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cfg = JSON.parse(fs.readFileSync(path.join(root, "config/control-plane-budget.json"), "utf8"));
const workflowDir = path.join(root, ".github/workflows");
const workflowFiles = fs.existsSync(workflowDir)
  ? fs.readdirSync(workflowDir).filter((name) => /\.ya?ml$/i.test(name)).length
  : 0;

const current = { github: { workflowFiles } };
const regressions = [];

if (workflowFiles > cfg.baseline.github.workflowFiles) {
  regressions.push({
    metric: "github.workflowFiles",
    baseline: cfg.baseline.github.workflowFiles,
    current: workflowFiles,
    target: cfg.budgets.github.maxTopLevelTriggeredWorkflows
  });
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
