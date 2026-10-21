import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const APPLY_I18N = resolve('tools/site-shell/apply-i18n.mjs');

// Run the real production transformer, not a regex approximation. Never mutate
// checked-in site files during the regression suite.
export function applyI18nFixture(html, relativePath = 'index.html') {
  if (relativePath.startsWith('/') || relativePath.includes('..')) throw new Error('Fixture path must be relative');
  const root = mkdtempSync(join(tmpdir(), 'bg-i18n-regression-'));
  try {
    const target = join(root, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html, 'utf8');
    execFileSync(process.execPath, [APPLY_I18N], { cwd: root, stdio: 'pipe' });
    const once = readFileSync(target, 'utf8');
    execFileSync(process.execPath, [APPLY_I18N], { cwd: root, stdio: 'pipe' });
    const twice = readFileSync(target, 'utf8');
    return { once, twice };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
