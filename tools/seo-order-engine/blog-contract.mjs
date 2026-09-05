import { ORIGIN } from './registry.mjs';
import { injectSeoGraph } from './schema.mjs';

function stripTags(value) {
  return String(value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function attr(tag, name) {
  const m = String(tag).match(new RegExp(`\\b${naamVeilig(name)}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}

function naamVeilig(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function headOf(html) {
  return String(html).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
}

function bodyOf(html) {
  return String(html).match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
}

function articleOf(html) {
  const body = bodyOf(html);
  return body.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || body;
}

function metaContent(html, matcher) {
  const head = headOf(html);
  const tag = [...head.matchAll(/<meta\b[^>]*>/gi)].find(matcher)?.[0] || '';
  return attr(tag, 'content');
}

function titleOf(html) {
  return stripTags(headOf(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
}

function descriptionOf(html) {
  return metaContent(html, m => /^description$/i.test(attr(m[0], 'name')));
}

function canonicalOf(html) {
  const tag = [...headOf(html).matchAll(/<link\b[^>]*>/gi)].find(m => /(?:^|\s)canonical(?:\s|$)/i.test(attr(m[0], 'rel')))?.[0] || '';
  return attr(tag, 'href');
}

const MAANDEN = new Map([
  ['januari', '01'], ['februari', '02'], ['maart', '03'], ['april', '04'], ['mei', '05'], ['juni', '06'],
  ['juli', '07'], ['augustus', '08'], ['september', '09'], ['oktober', '10'], ['november', '11'], ['december', '12']
]);

function isoDateFromVisibleText(html) {
  const visible = stripTags(bodyOf(html));
  let m = visible.match(/\b([0-3]?\d)[-/.]([01]?\d)[-/.](20\d{2})\b/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  m = visible.match(/\b([0-3]?\d)\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)\s+(20\d{2})\b/i);
  if (m) return `${m[3]}-${MAANDEN.get(m[2].toLocaleLowerCase('nl-NL'))}-${String(m[1]).padStart(2, '0')}`;
  return '';
}

function dateFromHtml(html, property) {
  const direct = metaContent(html, m => attr(m[0], 'property').toLowerCase() === `article:${property}_time`);
  if (direct) return direct.slice(0, 10);
  const key = property === 'published' ? 'datePublished' : 'dateModified';
  const match = String(html).match(new RegExp(`"${key}"\\s*:\\s*"(\\d{4}-\\d{2}-\\d{2})`, 'i'));
  if (match?.[1]) return match[1];
  return isoDateFromVisibleText(html);
}

function keywordOf(html) {
  return metaContent(html, m => /^bg-zoekwoord$/i.test(attr(m[0], 'name')));
}

function normalize(value) {
  return String(value || '').toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreEntry(entry, haystack) {
  const phrases = [entry.primary_keyword, ...(entry.secondary_keywords || [])].filter(Boolean);
  let score = entry.role === 'money' ? 1 : 0;
  for (const phrase of phrases) {
    const normalized = normalize(phrase);
    if (!normalized) continue;
    if (haystack.includes(normalized)) score += 8;
    for (const token of normalized.split(/\s+/).filter(t => t.length >= 3)) {
      if (haystack.includes(token)) score += 1;
    }
  }
  return score;
}

export function dominantCommercialEntry(html, registry) {
  const candidates = (registry?.pages || []).filter(entry => entry.role === 'money' || entry.role === 'pillar');
  if (!candidates.length) return null;
  const haystack = normalize([titleOf(html), descriptionOf(html), keywordOf(html), stripTags(articleOf(html))].join(' '));
  const ranked = candidates.map(entry => ({ entry, score: scoreEntry(entry, haystack) }))
    .sort((a, b) => b.score - a.score || (a.entry.role === 'money' ? -1 : 1) || a.entry.route.localeCompare(b.entry.route));
  if (ranked[0]?.score > 0) return ranked[0].entry;
  return candidates.find(entry => entry.route === `${ORIGIN}/`) || candidates.find(entry => entry.role === 'money') || candidates[0];
}

function hasEvidence(html) {
  const article = articleOf(html);
  if (/data-bg-evidence(?:\s|=|>)/i.test(article)) return true;
  if (/<table\b/i.test(article)) return true;
  if (/class=(?:"[^"]*\b(?:bronnen?|bewijs|onderbouwing|callout|tabelwrap|case|resultaat|praktijk|voorbeeld|methode|vergelijk)\b[^"]*"|'[^']*\b(?:bronnen?|bewijs|onderbouwing|callout|tabelwrap|case|resultaat|praktijk|voorbeeld|methode|vergelijk)\b[^']*')/i.test(article)) return true;
  if (/<h[1-4]\b[^>]*>[^<]*(?:bronnen?|onderbouwing|berekening|methode|onderzoek|case|resultaat|voorbeeld|in de praktijk|uit de praktijk|vergelijking)[^<]*<\/h[1-4]>/i.test(article)) return true;
  const external = [...article.matchAll(/<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>/gi)]
    .map(m => m[1] ?? m[2] ?? '')
    .filter(href => /^https:\/\//i.test(href) && !href.startsWith(`${ORIGIN}/`));
  return external.length > 0;
}

function internalArticleLinks(html) {
  return [...articleOf(html).matchAll(/<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>/gi)]
    .map(m => m[1] ?? m[2] ?? '')
    .filter(href => href.startsWith(`${ORIGIN}/`));
}

function ensureContractMeta(html) {
  if (/<meta\b[^>]*name=(?:"bg-order-contract"|'bg-order-contract')[^>]*content=(?:"v1"|'v1')[^>]*>/i.test(headOf(html))) return String(html);
  return String(html).replace(/<\/head>/i, `\n<meta name="bg-order-contract" content="v1">\n</head>`);
}

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ensureOrderStyle(html) {
  if (/id=["']bg-order-content-style["']/i.test(headOf(html))) return String(html);
  const style = `<style id="bg-order-content-style">.bg-order-author{margin:1rem 0 1.5rem;padding:.85rem 1rem;border:1px solid rgba(39,66,214,.18);border-radius:12px;background:rgba(39,66,214,.04);font-size:.92rem}.bg-order-author a{font-weight:700}.bg-order-path{margin:2.5rem 0;padding:1.4rem;border:1px solid rgba(20,23,26,.14);border-radius:14px;background:#fff}.bg-order-path h2{margin:0 0 .45rem}.bg-order-actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1rem}.bg-order-actions a{display:inline-block;padding:.7rem 1rem;border-radius:999px;text-decoration:none;font-weight:700}.bg-order-money{border:1px solid currentColor}.bg-order-primary{background:#2742D6;color:#fff}</style>`;
  return String(html).replace(/<\/head>/i, `\n${style}\n</head>`);
}

function ensureAuthorBlock(html, modified) {
  if (/id=["']bg-order-author["']/i.test(bodyOf(html))) return String(html);
  const out = String(html);
  const dateText = modified ? `<time datetime="${modified}">Inhoudelijk bijgewerkt ${modified}</time>` : '';
  const block = `<aside id="bg-order-author" class="bg-order-author" data-bg-author="arthur-prinsen" aria-label="Auteur en inhoudelijke review">Geschreven en inhoudelijk gereviewd door <a href="${ORIGIN}/over-ons">Arthur Prinsen</a>${dateText ? ` · ${dateText}` : ''}.</aside>`;
  if (/<article\b[^>]*>/i.test(out)) return out.replace(/<article\b[^>]*>/i, m => `${m}\n${block}`);
  if (/<main\b[^>]*>/i.test(out)) return out.replace(/<main\b[^>]*>/i, m => `${m}\n${block}`);
  return out.replace(/<body\b[^>]*>/i, m => `${m}\n${block}`);
}

function ensureOrderPath(html, commercial) {
  if (/id=["']bg-order-path["']/i.test(bodyOf(html))) return String(html);
  const out = String(html);
  if (!commercial) return out;
  const targetLabel = commercial.role === 'money' ? commercial.primary_intent : 'digitalisering voor het mkb';
  const cta = commercial.primary_cta || { action: 'zelfscan', url: `${ORIGIN}/zelfscan` };
  const section = `<section id="bg-order-path" class="bg-order-path" aria-label="Volgende stap"><h2>Van weten naar doen</h2><p>Dit artikel helpt je oriënteren. Bekijk daarna de concrete aanpak voor ${escapeHtml(targetLabel)}.</p><div class="bg-order-actions"><a class="bg-order-money" data-bg-money-route="${commercial.route}" href="${commercial.route}">Bekijk de aanpak</a><a class="bg-order-primary" data-bg-order-cta="${escapeHtml(cta.action)}" href="${cta.url}">${cta.action === 'frisse-blik' ? 'Plan een Frisse Blik' : 'Doe de gratis zelfscan'}</a></div></section>`;
  if (/<\/article>/i.test(out)) return out.replace(/<\/article>/i, `${section}\n</article>`);
  if (/<\/main>/i.test(out)) return out.replace(/<\/main>/i, `${section}\n</main>`);
  return out.replace(/<\/body>/i, `${section}\n</body>`);
}

export function inspectBlog(input, path, registry) {
  const html = String(input);
  const fouten = [];
  const commercial = dominantCommercialEntry(html, registry);
  const modified = dateFromHtml(html, 'modified') || dateFromHtml(html, 'published');
  const internal = internalArticleLinks(html);

  if (!/data-bg-author=["']arthur-prinsen["']/i.test(html)) fouten.push(`${path}: auteur/reviewer ontbreekt`);
  if (!modified || !new RegExp(`<time\\b[^>]*datetime=["']${modified}["']`, 'i').test(html)) fouten.push(`${path}: zichtbare inhoudsdatum ontbreekt`);
  if (!hasEvidence(html)) fouten.push(`${path}: bewijs/bronnen ontbreekt`);
  if (internal.length < 2) fouten.push(`${path}: minimaal twee contextuele interne links vereist`);
  if (!commercial || (!html.includes(`href="${commercial.route}"`) && !html.includes(`href='${commercial.route}'`))) fouten.push(`${path}: link naar dominante money page ontbreekt`);
  if (!/data-bg-order-cta(?:\s|=|>)/i.test(html)) fouten.push(`${path}: primaire CTA ontbreekt`);
  if (!/id=["']bg-seo-order-graph["']/i.test(html)) fouten.push(`${path}: SEO order graph ontbreekt`);
  if (!/<meta\b[^>]*name=(?:"bg-order-contract"|'bg-order-contract')[^>]*content=(?:"v1"|'v1')[^>]*>/i.test(headOf(html))) fouten.push(`${path}: bg-order-contract v1 ontbreekt`);
  if (/href=(?:"\/(?!\/)|'\/(?!\/))/i.test(articleOf(html))) fouten.push(`${path}: root-relative interne link in artikel`);

  return fouten;
}

export function enrichBlog(input, path, registry) {
  let html = String(input);
  const canonical = canonicalOf(html);
  const title = titleOf(html);
  const description = descriptionOf(html);
  const published = dateFromHtml(html, 'published');
  const modified = dateFromHtml(html, 'modified') || published;
  const commercial = dominantCommercialEntry(html, registry);

  html = ensureContractMeta(html);
  html = ensureOrderStyle(html);
  html = ensureAuthorBlock(html, modified);
  html = ensureOrderPath(html, commercial);
  html = injectSeoGraph(html, {
    canonical,
    title,
    description,
    schema_type: 'Article',
    datePublished: published || undefined,
    dateModified: modified || undefined,
    breadcrumbs: [
      { name: 'Home', url: `${ORIGIN}/` },
      { name: 'Kennis', url: `${ORIGIN}/blog/` },
      { name: title || 'Artikel', url: canonical }
    ]
  });
  return html;
}
