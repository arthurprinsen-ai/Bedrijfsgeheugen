import { readFile, writeFile, glob } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveReleaseCommitRef } from './release-source-identity.mjs';
import { ensureReleaseMarker } from './release-marker.mjs';

export async function stampReleaseIdentity({ env = process.env } = {}) {
  let sourceMarker = '';
  try {
    sourceMarker = await readFile('.bg-source-commit', 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const commitRef = resolveReleaseCommitRef({ env, markerText: sourceMarker });
  let releaseStamped = 0;
  for await (const bestand of glob('**/*.html')) {
    if (
      bestand.startsWith('node_modules/') ||
      bestand.startsWith('.git/') ||
      bestand.startsWith('dist/') ||
      bestand.startsWith('.netlify/')
    ) continue;
    let html;
    try {
      html = await readFile(bestand, 'utf8');
    } catch {
      continue;
    }
    if (!/<html\b/i.test(html) || !/<\/head>/i.test(html)) continue;
    const next = ensureReleaseMarker(html, commitRef);
    if (next !== html) {
      await writeFile(bestand, next, 'utf8');
      releaseStamped++;
    }
  }
  console.log('RELEASE_HTML_MARKERS', JSON.stringify({ commit_ref: commitRef, files: releaseStamped }));

  const evidence = {
    contract: 'BRAIN-DELIVERY-v2',
    production_authority: 'BG169',
    commit_ref: commitRef,
    context: String(env.CONTEXT || ''),
    deploy_id: String(env.DEPLOY_ID || ''),
    generated_at: new Date().toISOString(),
  };
  await writeFile('release.json', JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  console.log('RELEASE_EVIDENCE', commitRef);
  return evidence;
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : '';
if (invoked && fileURLToPath(import.meta.url) === invoked) await stampReleaseIdentity();
