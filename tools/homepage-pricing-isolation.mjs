export const HOMEPAGE_PRICING_FORBIDDEN_SIGNATURES = Object.freeze([
  { label: '#prijzen', pattern: /<section\b[^>]*\bid=["']prijzen["']/i },
  { label: 'scenario-prijzen-home', pattern: /\bid=["']scenario-prijzen-home["']/i },
  { label: 'pakketten-home', pattern: /\bid=["']pakketten-home["']/i },
  { label: 'Vraag het deze pagina', pattern: /Vraag het deze pagina/i },
  { label: 'Reken het even na', pattern: /Reken het even na/i },
  { label: 'Kies je rol', pattern: /Kies je rol/i },
]);

export function homepagePricingIsolationFailures(html) {
  const source = String(html || '');
  return HOMEPAGE_PRICING_FORBIDDEN_SIGNATURES
    .filter(({ pattern }) => pattern.test(source))
    .map(({ label }) => `pricing-only homepage-signatuur gevonden: ${label}`);
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
