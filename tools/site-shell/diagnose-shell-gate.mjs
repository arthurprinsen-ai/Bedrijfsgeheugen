import { readFile, writeFile } from 'node:fs/promises';
import { controleerSiteUi } from '../controleer-site-ui.mjs';
import { CANONICAL_SHELL_SOURCE } from './apply-shell.mjs';

async function schrijfBronDiagnose() {
  try {
    const html = await readFile(CANONICAL_SHELL_SOURCE, 'utf8');
    await writeFile('shell-gate-canonical-source.html', html, 'utf8');
  } catch {}
}

try {
  await controleerSiteUi();
  await schrijfBronDiagnose();
  await writeFile('shell-gate-diagnostic.txt', 'OK\n', 'utf8');
  console.log('Canonical shell diagnostic: OK');
} catch (error) {
  const tekst = `${error?.stack || error}\n`;
  await writeFile('shell-gate-diagnostic.txt', tekst, 'utf8');
  await schrijfBronDiagnose();
  const match = String(error?.message || error).match(/^([^:]+\.html):/);
  if (match) {
    try {
      const html = await readFile(match[1], 'utf8');
      await writeFile('shell-gate-failed-page.html', html, 'utf8');
    } catch {}
  }
  console.error(tekst);
  throw error;
}