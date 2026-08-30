const POLICIES = Object.freeze({
  'approved-central-blog': [/^blog\/.+/, /^sitemap\.xml$/],
  'blog-bijwerken': [/^blog\/.+/, /^sitemap\.xml$/],
  'menu-balk-fix': [/^[^/]+\.html$/, /^brain\/evidence\/writer-canary\/menu-balk-fix-\d+-\d+\.json$/],
  'paginacontrole': [/^[^/]+\.html$/, /^seo-status\.json$/, /^sitemap\.xml$/, /^netlify\.toml$/],
  'regelgeving-bijwerken': [/^data\/regelgeving\.json$/],
  'seo-controle': [/^sitemap\.xml$/, /^netlify\.toml$/],
  'weekblog': [/^blog\/.+/, /^sitemap\.xml$/],
});

const IMPACT_BUDGETS = Object.freeze({
  // Paginacontrole performs deterministic metadata/link/status repairs only.
  'paginacontrole': Object.freeze({ maxChangedLinesPerFile: 50 }),
});

export function allowedForWriter(writer) {
  const policy = POLICIES[String(writer || '')];
  if (!policy) throw new Error(`UNKNOWN_WRITER:${writer || ''}`);
  return [...policy];
}

export function validateWriterPaths(writer, files = [], diffStats = []) {
  const policy = allowedForWriter(writer);
  const normalized = [...new Set((Array.isArray(files) ? files : []).map(String).filter(Boolean))].sort();
  const rejected = normalized.filter((file) => !policy.some((matcher) => matcher.test(file)));
  if (rejected.length) throw new Error(`UNAPPROVED_WRITER_PATH:${rejected.join(',')}`);

  const budget = IMPACT_BUDGETS[String(writer || '')];
  if (budget && Array.isArray(diffStats)) {
    for (const stat of diffStats) {
      const file = String(stat?.file || '');
      if (!normalized.includes(file)) continue;
      const additions = Number(stat?.additions || 0);
      const deletions = Number(stat?.deletions || 0);
      if (!Number.isFinite(additions) || !Number.isFinite(deletions)) {
        throw new Error(`INVALID_WRITER_DIFF_STAT:${file}`);
      }
      if (additions + deletions > budget.maxChangedLinesPerFile) {
        throw new Error(`WRITER_DIFF_IMPACT_EXCEEDED:${file}:${additions + deletions}:${budget.maxChangedLinesPerFile}`);
      }
    }
  }

  return Object.freeze({ ok: true, writer, files: normalized });
}
