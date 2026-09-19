const POLICIES = Object.freeze({
  'approved-central-blog': [/^blog\/.+/, /^sitemap\.xml$/],
  'blog-bijwerken': [/^blog\/.+/, /^sitemap\.xml$/],
  'menu-balk-fix': [/^[^/]+\.html$/, /^brain\/evidence\/writer-canary\/menu-balk-fix-\d+-\d+\.json$/],
  'native-daily-blog': [
    /^blog\/index\.html$/,
    /^blog\/[^/]+\/index\.html$/,
    /^blog\/rss\.xml$/,
    /^data\/content-publication-ledger\.json$/,
    /^sitemap\.xml$/,
  ],
  'native-daily-blog-proof': [/^data\/content-publication-ledger\.json$/],
  'paginacontrole': [/^[^/]+\.html$/, /^seo-status\.json$/, /^sitemap\.xml$/, /^netlify\.toml$/],
  'regelgeving-bijwerken': [/^data\/regelgeving\.json$/],
  'regulatory-source-watch': [/^data\/regulatory-source-state\.json$/],
  'seo-controle': [/^sitemap\.xml$/, /^netlify\.toml$/],
  'weekblog': [/^blog\/.+/, /^sitemap\.xml$/],
});

const MATERIAL_WRITEBACK_CLOSURE_PATHS = Object.freeze([
  /^brain\/learning\/.+\.json$/,
  /^docs\/development-ledger-events\/.+\.md$/,
  /^docs\/development-ledger\/.+\.md$/,
  /^docs\/(changes|learning)\/.+\.md$/,
]);

const IMPACT_BUDGETS = Object.freeze({
  // Paginacontrole performs deterministic metadata/link/status repairs only.
  'paginacontrole': Object.freeze({ maxChangedLinesPerFile: 50 }),
});

export function allowedForWriter(writer) {
  const policy = POLICIES[String(writer || '')];
  if (!policy) throw new Error(`UNKNOWN_WRITER:${writer || ''}`);
  return [...policy, ...MATERIAL_WRITEBACK_CLOSURE_PATHS];
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
