#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KNOWN_TRIGGERS = new Set([
  'branch_protection_rule','check_run','check_suite','create','delete','deployment','deployment_status',
  'discussion','discussion_comment','fork','gollum','issue_comment','issues','label','merge_group','milestone',
  'page_build','project','project_card','project_column','public','pull_request','pull_request_review',
  'pull_request_review_comment','pull_request_target','push','registry_package','release','repository_dispatch',
  'schedule','status','watch','workflow_call','workflow_dispatch','workflow_run'
]);

function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if ((c === '"' || c === "'") && line[i - 1] !== '\\') quote = quote === c ? null : (quote || c);
    if (c === '#' && !quote) return line.slice(0, i);
  }
  return line;
}

export function classifyWorkflowSource(source) {
  const lines = source.split(/\r?\n/);
  let inOn = false;
  let onIndent = -1;
  const triggers = [];

  for (const raw of lines) {
    const line = stripComment(raw);
    if (!line.trim()) continue;
    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();

    if (!inOn) {
      const inline = trimmed.match(/^on:\s*\[([^\]]+)\]\s*$/);
      if (indent === 0 && inline) {
        for (const part of inline[1].split(',').map(v => v.trim()).filter(Boolean)) {
          if (KNOWN_TRIGGERS.has(part) && !triggers.includes(part)) triggers.push(part);
        }
        continue;
      }
      const scalar = trimmed.match(/^on:\s*([A-Za-z_]+)\s*$/);
      if (indent === 0 && scalar) {
        if (KNOWN_TRIGGERS.has(scalar[1])) triggers.push(scalar[1]);
        continue;
      }
      if (indent === 0 && /^on:\s*$/.test(trimmed)) {
        inOn = true;
        onIndent = indent;
      }
      continue;
    }

    if (indent <= onIndent) {
      inOn = false;
      onIndent = -1;
      continue;
    }

    if (indent === onIndent + 2) {
      const match = trimmed.match(/^([A-Za-z_]+):/);
      if (match && KNOWN_TRIGGERS.has(match[1]) && !triggers.includes(match[1])) triggers.push(match[1]);
    }
  }

  return {
    triggers,
    topLevelPrTrigger: triggers.includes('pull_request') || triggers.includes('pull_request_target'),
    reusableOnly: triggers.length === 1 && triggers[0] === 'workflow_call'
  };
}

export function inventoryWorkflowDirectory(workflowDir) {
  const files = fs.readdirSync(workflowDir).filter(name => /\.ya?ml$/i.test(name)).sort();
  return files.map(name => {
    const filePath = path.join(workflowDir, name);
    const source = fs.readFileSync(filePath, 'utf8');
    return { name, ...classifyWorkflowSource(source) };
  });
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const root = process.cwd();
  const workflowDir = path.join(root, '.github', 'workflows');
  const inventory = inventoryWorkflowDirectory(workflowDir);
  const summary = {
    workflow_count: inventory.length,
    top_level_pr_trigger_count: inventory.filter(item => item.topLevelPrTrigger).length,
    reusable_only_count: inventory.filter(item => item.reusableOnly).length,
    top_level_pr_triggers: inventory.filter(item => item.topLevelPrTrigger).map(item => item.name),
    inventory
  };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}
