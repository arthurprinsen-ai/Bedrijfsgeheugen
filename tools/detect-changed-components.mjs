import { readFile } from 'node:fs/promises';

function matches(path, pattern) {
  if (pattern.endsWith('/**')) return path.startsWith(pattern.slice(0, -3));
  if (!pattern.includes('*')) return path === pattern;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escaped.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')}$`);
  return regex.test(path);
}

export async function detectChangedComponents(paths, ownershipPath = 'config/component-ownership.json') {
  const ownership = JSON.parse(await readFile(ownershipPath, 'utf8'));
  const changed = [];
  for (const [componentId, patterns] of Object.entries(ownership)) {
    if (paths.some(path => patterns.some(pattern => matches(path, pattern)))) changed.push(componentId);
  }
  return changed.sort();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const components = await detectChangedComponents(process.argv.slice(2));
  process.stdout.write(JSON.stringify(components));
}
