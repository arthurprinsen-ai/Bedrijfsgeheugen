import { readFile } from 'node:fs/promises';

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')}$`);
}

export async function validateChangedPaths({ paths, changeClass, configPath = 'config/change-classes.json' }) {
  const classes = JSON.parse(await readFile(configPath, 'utf8'));
  const definition = classes[changeClass];
  if (!definition) return { ok: false, violations: [`Unknown change class: ${changeClass}`] };
  const rules = definition.allowed.map(globToRegExp);
  const violations = paths
    .filter(path => !rules.some(rule => rule.test(path)))
    .map(path => `${path} is outside ${changeClass}`);
  return { ok: violations.length === 0, violations };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [changeClass, ...paths] = process.argv.slice(2);
  if (!changeClass || paths.length === 0) throw new Error('Usage: node tools/verify-change-scope.mjs <change-class> <path...>');
  const result = await validateChangedPaths({ paths, changeClass });
  if (!result.ok) {
    console.error(result.violations.join('\n'));
    process.exitCode = 1;
  }
}
