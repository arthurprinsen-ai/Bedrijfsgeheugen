const TEST_REF_RE = /tests\/[A-Za-z0-9_./-]+\.test\.mjs/g;
const PROVIDER_MUTATION_PATTERNS = [
  /\bnetlify\s+deploy\b/i,
  /\bsupabase\s+(?:functions\s+deploy|db\s+push|migration\s+up)\b/i,
  /\bgh\s+workflow\s+run\b/i,
  /\bcurl\b[^\n]*(?:netlify|supabase|linkedin|instagram|graph\.facebook)/i,
  /github\/codeql-action\/analyze/i,
  /github\/codeql-action\/init/i
];

function collectTests(source) {
  return [...new Set(source.match(TEST_REF_RE) || [])].sort();
}

export function assessWorkflowRetirement({ candidateSource, canonicalSources }) {
  const candidateTests = collectTests(candidateSource);
  const canonicalTests = new Set(canonicalSources.flatMap(collectTests));
  const missingTests = candidateTests.filter(test => !canonicalTests.has(test));
  const blockers = [];
  if (PROVIDER_MUTATION_PATTERNS.some(re => re.test(candidateSource))) blockers.push('provider-mutation');
  if (missingTests.length) blockers.push('missing-canonical-test-coverage');
  if (!candidateTests.length && !blockers.includes('provider-mutation')) blockers.push('no-provable-test-contract');
  return {
    candidateTests,
    missingTests,
    blockers,
    safeToRemoveDirectPrTrigger: blockers.length === 0
  };
}
