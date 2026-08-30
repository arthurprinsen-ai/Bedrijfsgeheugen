import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const normalize = value => String(value ?? '').trim().replace(/\\/g, '/').replace(/^\.\//, '');

export function inferContractDomains(file) {
  const path = normalize(file).toLowerCase();
  const domains = new Set();

  if (/^package(-lock)?\.json$/.test(path)) domains.add('runtime:node-dependencies');
  if (path === 'netlify.toml') domains.add('delivery:netlify');
  if (path.startsWith('.github/workflows/unified-brain-delivery')) domains.add('delivery:brain');
  if (path.startsWith('tools/brain-delivery') || path.startsWith('tools/delivery-') || path.startsWith('config/delivery-')) domains.add('delivery:brain');
  if (path.startsWith('supabase/migrations/') || /supabase.*schema|schema.*supabase/.test(path)) domains.add('data:supabase-schema');
  if (path.includes('dataforseo') && /(contract|schema|manifest|interface|client)/.test(path)) domains.add('integration:dataforseo');
  if (path.includes('notion') && /(contract|schema|manifest|interface|mapping)/.test(path)) domains.add('integration:notion');
  if ((path.includes('/make/') || path.startsWith('make/') || path.includes('scenario')) && /(contract|schema|manifest|interface|mapping)/.test(path)) domains.add('integration:make');

  const contractMatch = path.match(/(?:^|\/)([^/]+)[^/]*(?:contract|schema|manifest|interface)(?:\.|\/|$)/);
  if (contractMatch?.[1]) domains.add(`contract:${contractMatch[1]}`);

  return [...domains].sort();
}

export function buildImpactDecision({ candidateFiles = [], mainFiles = [] } = {}) {
  const candidate = [...new Set(candidateFiles.map(normalize).filter(Boolean))].sort();
  const advanced = [...new Set(mainFiles.map(normalize).filter(Boolean))].sort();
  const advancedSet = new Set(advanced);
  const fileOverlap = candidate.filter(file => advancedSet.has(file));

  const candidateContracts = [...new Set(candidate.flatMap(inferContractDomains))].sort();
  const mainContracts = [...new Set(advanced.flatMap(inferContractDomains))].sort();
  const mainContractSet = new Set(mainContracts);
  const contractOverlap = candidateContracts.filter(domain => mainContractSet.has(domain));

  return Object.freeze({
    safe: fileOverlap.length === 0 && contractOverlap.length === 0,
    candidateFiles: candidate,
    mainAdvancedFiles: advanced,
    fileOverlap,
    candidateContracts,
    mainContracts,
    contractOverlap,
    requiresRefresh: fileOverlap.length > 0 || contractOverlap.length > 0,
  });
}

function gitDiffNames(base, head) {
  if (!base || !head || base === head) return [];
  const output = execFileSync('git', ['diff', '--name-only', `${base}..${head}`], { encoding: 'utf8' });
  return output.split(/\r?\n/).map(normalize).filter(Boolean);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (key) args[key] = argv[i + 1];
  }
  return args;
}

export function evaluateCurrentMain({ base, head, currentMain }) {
  if (!base || !head || !currentMain) throw new Error('base, head and current-main are required');
  if (base === currentMain) return buildImpactDecision({ candidateFiles: gitDiffNames(base, head), mainFiles: [] });
  return buildImpactDecision({ candidateFiles: gitDiffNames(base, head), mainFiles: gitDiffNames(base, currentMain) });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const decision = evaluateCurrentMain({ base: args.base, head: args.head, currentMain: args['current-main'] });
  process.stdout.write(`${JSON.stringify(decision)}\n`);
  if (!decision.safe) process.exitCode = 42;
}
