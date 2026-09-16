const API_VERSION = '2022-11-28';

function numericId(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? String(parsed) : String(value ?? '');
}

export function reconcileGitHubBacklog(registry = {}, openPulls = []) {
  const liveById = new Map(openPulls.map(pr => [numericId(pr.number ?? pr.id), pr]));
  const knownItems = registry.items ?? [];
  const knownById = new Map(knownItems.filter(item => item.kind === 'pull_request').map(item => [numericId(item.id), item]));
  const nonPrItems = knownItems.filter(item => item.kind !== 'pull_request');
  const liveItems = [];

  for (const [id, pr] of liveById) {
    const known = knownById.get(id);
    if (known) {
      liveItems.push({
        ...known,
        metadata: {
          ...(known.metadata ?? {}),
          github: {
            number: Number(id),
            title: pr.title ?? null,
            draft: pr.draft === true,
            head_sha: pr.head?.sha ?? pr.head_sha ?? null,
            updated_at: pr.updated_at ?? null,
            author: pr.user?.login ?? null
          }
        }
      });
      continue;
    }
    liveItems.push({
      id,
      kind: 'pull_request',
      component: '',
      problemClass: '',
      changeClass: 'unclassified-live-pr',
      scope: 'global',
      criticalEvidence: { security: false, correctness: false },
      baselineComparable: false,
      metadata: {
        github: {
          number: Number(id),
          title: pr.title ?? null,
          draft: pr.draft === true,
          head_sha: pr.head?.sha ?? pr.head_sha ?? null,
          updated_at: pr.updated_at ?? null,
          author: pr.user?.login ?? null
        }
      }
    });
  }

  return {
    ...registry,
    items: [...nonPrItems, ...liveItems],
    source_state: {
      mode: 'live-github',
      open_pull_requests: liveItems.length,
      unknown_pull_requests: liveItems.filter(item => !item.component || !item.problemClass).length,
      registry_pull_requests_not_open: [...knownById.keys()].filter(id => !liveById.has(id)).sort((a, b) => Number(a) - Number(b))
    }
  };
}

export async function fetchOpenPullRequests({ repository = process.env.GITHUB_REPOSITORY, token = process.env.GITHUB_TOKEN } = {}) {
  if (!repository || !token) return null;
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) throw new Error('invalid GITHUB_REPOSITORY');
  const results = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=100&page=${page}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': API_VERSION,
        'User-Agent': 'bedrijfsgeheugen-powerhouse-autonomous-improvement'
      }
    });
    if (!response.ok) throw new Error(`GitHub backlog sensor failed: ${response.status}`);
    const batch = await response.json();
    results.push(...batch);
    if (batch.length < 100) break;
  }
  return results;
}

export async function resolveRuntimeBacklog(registry, options = {}) {
  const openPulls = options.openPulls ?? await fetchOpenPullRequests(options);
  if (!openPulls) {
    return {
      ...registry,
      source_state: {
        mode: 'registry-fallback',
        reason: 'GitHub token or repository unavailable'
      }
    };
  }
  return reconcileGitHubBacklog(registry, openPulls);
}
