import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { interactionContracts } from './interaction-contracts.mjs';

function read(rootDir, path) { return readFileSync(resolve(rootDir, path), 'utf8'); }
function push(errors, contractId, path, expected) { errors.push({ contractId, code: 'build-wiring-loss', path, expected }); }

export function checkFinalInteractionWiring({ rootDir = process.cwd(), contracts = interactionContracts } = {}) {
  const errors = [];
  let netlify = '';
  let pipeline = '';
  try { netlify = read(rootDir, 'netlify.toml'); } catch { push(errors, '<global>', 'netlify.toml', 'readable Netlify build configuration'); }
  try { pipeline = read(rootDir, 'tools/prijzen-uit-de-homepage.mjs'); } catch { push(errors, '<global>', 'tools/prijzen-uit-de-homepage.mjs', 'readable final homepage pipeline'); }
  if (netlify && !/node tools\/prijzen-uit-de-homepage\.mjs/.test(netlify)) push(errors, '<global>', 'netlify.toml', 'node tools/prijzen-uit-de-homepage.mjs');

  const requirements = {
    'homepage-scroll-story': {
      builder: 'tools/bouw-v18-homepage-scroll-story.mjs',
      importMarker: 'bouw-v18-homepage-scroll-story.mjs',
      sourceMarkers: ['setStoryState', 'requestAnimationFrame', 'data-bg-story-state', 'data-bg-story-step', 'data-bg-story-overlay', 'prefers-reduced-motion'],
    },
    'homepage-platform-expertise-toggle': {
      builder: 'tools/bouw-v18-homepage-platform-expertise-toggle.mjs',
      importMarker: 'bouw-v18-homepage-platform-expertise-toggle.mjs',
      sourceMarkers: ['aria-selected', 'aria-controls', 'keydown', 'data-bg-home-tab', 'data-bg-home-panel'],
    },
  };

  for (const contract of contracts) {
    const req = requirements[contract.id];
    if (!req) continue;
    if (pipeline && !pipeline.includes(req.importMarker)) push(errors, contract.id, 'tools/prijzen-uit-de-homepage.mjs', req.importMarker);
    let source = '';
    try { source = read(rootDir, req.builder); } catch { push(errors, contract.id, req.builder, 'readable interaction builder'); continue; }
    for (const marker of req.sourceMarkers) if (!source.includes(marker)) push(errors, contract.id, req.builder, marker);
  }
  return { ok: errors.length === 0, errors };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const result = checkFinalInteractionWiring();
  if (!result.ok) { for (const error of result.errors) console.error(JSON.stringify(error)); process.exitCode = 1; }
  else console.log('Final interaction wiring OK');
}
