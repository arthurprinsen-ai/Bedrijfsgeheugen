const POLICIES = Object.freeze({
  'approved-central-blog': [/^blog\/.+/, /^sitemap\.xml$/],
  'blog-bijwerken': [/^blog\/.+/, /^sitemap\.xml$/],
  'menu-balk-fix': [/^[^/]+\.html$/],
  'paginacontrole': [/^[^/]+\.html$/, /^seo-status\.json$/, /^sitemap\.xml$/, /^netlify\.toml$/],
  'regelgeving-bijwerken': [/^data\/regelgeving\.json$/],
  'seo-controle': [/^sitemap\.xml$/, /^netlify\.toml$/],
  'weekblog': [/^blog\/.+/, /^sitemap\.xml$/],
});

export function allowedForWriter(writer) {
  const policy = POLICIES[String(writer || '')];
  if (!policy) throw new Error(`UNKNOWN_WRITER:${writer || ''}`);
  return [...policy];
}

export function validateWriterPaths(writer, files = []) {
  const policy = allowedForWriter(writer);
  const normalized = [...new Set((Array.isArray(files) ? files : []).map(String).filter(Boolean))].sort();
  const rejected = normalized.filter((file) => !policy.some((matcher) => matcher.test(file)));
  if (rejected.length) throw new Error(`UNAPPROVED_WRITER_PATH:${rejected.join(',')}`);
  return Object.freeze({ ok: true, writer, files: normalized });
}
