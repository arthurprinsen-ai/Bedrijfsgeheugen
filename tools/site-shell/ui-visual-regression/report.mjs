import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export async function writeVisualRegressionReport(report, outputDir = 'artifacts/ui-visual-regression') {
  await mkdir(outputDir, { recursive: true });
  const path = join(outputDir, 'ui-visual-regression.json');
  await writeFile(path, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return path;
}

export function summarizeFailures(report) {
  return (report.results || [])
    .filter(result => (result.violations || []).length)
    .map(result => `${result.route} ${result.viewport.name} ${result.state}: ${result.violations.map(v => v.ruleId).join(', ')}`);
}

export async function ensureParent(path) {
  await mkdir(dirname(path), { recursive: true });
}
