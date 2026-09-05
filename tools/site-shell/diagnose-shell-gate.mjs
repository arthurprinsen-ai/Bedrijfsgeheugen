import { readFile, writeFile } from 'node:fs/promises';
import { controleerSiteUi } from '../controleer-site-ui.mjs';

try {
  await controleerSiteUi();
  await writeFile('shell-gate-diagnostic.txt', 'OK\n', 'utf8');
  console.log('Canonical shell diagnostic: OK');
} catch (error) {
  const tekst = `${error?.stack || error}\n`;
  await writeFile('shell-gate-diagnostic.txt', tekst, 'utf8');
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
