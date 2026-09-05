import { writeFile } from 'node:fs/promises';
import { controleerSiteUi } from '../controleer-site-ui.mjs';

try {
  await controleerSiteUi();
  await writeFile('shell-gate-diagnostic.txt', 'OK\n', 'utf8');
  console.log('Canonical shell diagnostic: OK');
} catch (error) {
  const tekst = `${error?.stack || error}\n`;
  await writeFile('shell-gate-diagnostic.txt', tekst, 'utf8');
  console.error(tekst);
  throw error;
}
