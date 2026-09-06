const STRUCTURAL_SIGNATURES = Object.freeze([
  { label: '#prijzen', pattern: /<section\b[^>]*\bid=["']prijzen["']/i },
  { label: 'scenario-prijzen-home', pattern: /\bid=["']scenario-prijzen-home["']/i },
  { label: 'pakketten-home', pattern: /\bid=["']pakketten-home["']/i },
  { label: 'bgx-vraagbalk', pattern: /<(?:div|section)\b[^>]*\bclass=["'][^"']*\bbgx-vraagbalk\b/i },
  { label: 'bgx-rekenaar', pattern: /<(?:div|section)\b[^>]*\bclass=["'][^"']*\bbgx-rekenaar\b/i },
  { label: 'bgx-rol', pattern: /<(?:div|section)\b[^>]*\bclass=["'][^"']*\bbgx-rol\b/i },
]);

const VISIBLE_TEXT_SIGNATURES = Object.freeze([
  { label: 'Vraag het deze pagina', pattern: /Vraag het deze pagina/i },
  { label: 'Reken het even na', pattern: /Reken het even na/i },
  { label: 'Kies je rol', pattern: /Kies je rol/i },
]);

export const HOMEPAGE_PRICING_FORBIDDEN_SIGNATURES = Object.freeze([
  ...STRUCTURAL_SIGNATURES,
  ...VISIBLE_TEXT_SIGNATURES,
]);

function withoutNonVisibleContent(html) {
  return String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

function removeBalancedElement(source, openingPattern) {
  let html = String(source || '');
  while (true) {
    const opening = openingPattern.exec(html);
    openingPattern.lastIndex = 0;
    if (!opening || opening.index == null) return html;

    const start = opening.index;
    const tag = opening[1].toLowerCase();
    const openingEnd = html.indexOf('>', start);
    if (openingEnd === -1) return html;

    const tokens = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    tokens.lastIndex = openingEnd + 1;
    let depth = 1;
    let end = openingEnd + 1;
    let token;
    while ((token = tokens.exec(html))) {
      if (/^<\//.test(token[0])) depth -= 1;
      else if (!/\/>$/.test(token[0])) depth += 1;
      if (depth === 0) {
        end = tokens.lastIndex;
        break;
      }
    }
    if (depth !== 0) return html;
    html = html.slice(0, start) + html.slice(end);
  }
}

export function stripHomepagePricingOnlyUi(html) {
  let source = String(html || '');
  const patterns = [
    /<(section)\b[^>]*\bid=["']prijzen["'][^>]*>/gi,
    /<(section)\b[^>]*\bid=["']scenario-prijzen-home["'][^>]*>/gi,
    /<(section)\b[^>]*\bid=["']pakketten-home["'][^>]*>/gi,
    /<(div|section)\b[^>]*\bclass=["'][^"']*\bbgx-vraagbalk\b[^"']*["'][^>]*>/gi,
    /<(div|section)\b[^>]*\bclass=["'][^"']*\bbgx-rekenaar\b[^"']*["'][^>]*>/gi,
    /<(div|section)\b[^>]*\bclass=["'][^"']*\bbgx-rol\b[^"']*["'][^>]*>/gi,
  ];
  for (const pattern of patterns) source = removeBalancedElement(source, pattern);
  return source;
}

export function homepagePricingIsolationFailures(html) {
  const source = String(html || '');
  const visible = withoutNonVisibleContent(source);
  const structuralFailures = STRUCTURAL_SIGNATURES
    .filter(({ pattern }) => pattern.test(source))
    .map(({ label }) => `pricing-only homepage-signatuur gevonden: ${label}`);
  const textFailures = VISIBLE_TEXT_SIGNATURES
    .filter(({ pattern }) => pattern.test(visible))
    .map(({ label }) => `pricing-only homepage-signatuur gevonden: ${label}`);
  return [...structuralFailures, ...textFailures];
}

export function homepagePricingIsolationFailuresForRoute(html, routeUrl) {
  let pathname;
  try {
    pathname = new URL(String(routeUrl || ''), 'https://www.bedrijfsgeheugen.nl').pathname;
  } catch {
    return ['homepage pricing-isolatie kan route niet bepalen'];
  }
  return pathname === '/' ? homepagePricingIsolationFailures(html) : [];
}
