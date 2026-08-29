const ROOT_PATTERN = /data-bg-component=["']([^"']+)["']/g;

export function validateComponentSource({ componentId, css = '', js = '' }) {
  const violations = [];
  for (const source of [css, js]) {
    for (const match of source.matchAll(ROOT_PATTERN)) {
      const referenced = match[1];
      if (referenced !== componentId) {
        violations.push(`${componentId} references foreign component root: ${referenced}`);
      }
    }
  }
  return { ok: violations.length === 0, violations };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [componentId, cssPath, jsPath] = process.argv.slice(2);
  if (!componentId) throw new Error('Usage: node tools/verify-component-boundaries.mjs <component-id> [css-path] [js-path]');
  const { readFile } = await import('node:fs/promises');
  const css = cssPath ? await readFile(cssPath, 'utf8') : '';
  const js = jsPath ? await readFile(jsPath, 'utf8') : '';
  const result = validateComponentSource({ componentId, css, js });
  if (!result.ok) {
    console.error(result.violations.join('\n'));
    process.exitCode = 1;
  }
}
