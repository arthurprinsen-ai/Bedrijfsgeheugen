import { markCanonicalComponents } from './contracts.mjs';

export const TRUST_BAR_HTML = `<div class="bg-uniform-trust" data-bg-component="trustbar" role="region" aria-label="Onze werkwijze"><div class="bg-uniform-trust-in">
  <span>✓ Vaste prijs, geen uurtje-factuurtje</span>
  <span>✓ In twee weken draaiend</span>
  <span>✓ Voor het Nederlandse mkb</span>
</div></div>`;

export const BRAND_SHELL_CSS = `<style id="bg-canonical-brand-shell">
.bg-uniform-trust{background:#17191f;color:#d7d9df;font-family:'Instrument Sans',system-ui,sans-serif;font-size:13px;line-height:1.35;border-bottom:1px solid rgba(255,255,255,.07)}
.bg-uniform-trust-in{max-width:1200px;margin:0 auto;padding:9px 22px;display:flex;align-items:center;justify-content:center;gap:12px 32px;flex-wrap:wrap}
.bg-uniform-trust span::first-letter{color:#FFE86B}
.bg-uniform-footer-contact{border-top:1px solid rgba(255,255,255,.12);margin-top:14px;padding-top:14px;display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;color:#a9b0bc;font-size:13px}
.bg-uniform-footer-contact a{color:inherit;text-decoration:none}.bg-uniform-footer-contact a:hover{text-decoration:underline}
header.v17-header{background:rgba(12,16,20,.98)!important;border-bottom:1px solid rgba(255,255,255,.10)!important}
header.v17-header a,header.v17-header a:visited,header.v17-header a:hover,header.v17-header .brand,header.v17-header .navbtn,header.v17-header .login{color:#fff}
header.v17-header .brand{text-decoration:none}
@media(max-width:640px){.bg-uniform-trust-in{justify-content:flex-start;padding:8px 18px;gap:5px 14px}.bg-uniform-trust{font-size:12px}}
</style>`;

export function renderFooterContact() {
  return `<div class="bg-uniform-footer-contact"><span>Bedrijfsgeheugen · Enschede</span><a href="mailto:arthur@bedrijfsgeheugen.nl">arthur@bedrijfsgeheugen.nl</a><a href="tel:+31627483345">06 27 48 33 45</a><span>ma–vr 08:00–18:00</span></div>`;
}

function openingForComponent(html, name) {
  const re = new RegExp(`<([a-z0-9-]+)\\b[^>]*data-bg-component="${name}"[^>]*>`, 'i');
  const match = String(html).match(re);
  if (!match) return null;
  return { match, tag: match[1].toLowerCase(), start: match.index };
}

export function extractComponent(input, name) {
  const html = String(input);
  const open = openingForComponent(html, name);
  if (!open) return null;
  const scan = new RegExp(`<${open.tag}\\b[^>]*>|<\\/${open.tag}\\s*>`, 'gi');
  scan.lastIndex = open.start;
  let depth = 0, token;
  while ((token = scan.exec(html))) {
    if (token[0].startsWith('</')) depth--; else depth++;
    if (depth === 0) return html.slice(open.start, scan.lastIndex);
  }
  return null;
}

export function replaceComponent(input, name, replacement) {
  const html = String(input);
  const current = extractComponent(html, name);
  if (!current) throw new Error(`canonical component not found: ${name}`);
  return html.replace(current, replacement);
}

export function markPageSlots(input) {
  let html = markCanonicalComponents(String(input));
  html = html.replace(/<main\b(?![^>]*data-bg-component)([^>]*)>/i, '<main$1 data-bg-component="main">');
  html = html.replace(/<section\b(?![^>]*data-bg-component)([^>]*\bclass="[^"]*\b(?:paginakop|hero)\b[^"]*"[^>]*)>/i,
    '<section$1 data-bg-component="hero">');
  return html;
}

export function ensureTrustBar(input) {
  let html = String(input);
  if (html.includes('data-bg-component="trustbar"') || html.includes('bg-uniform-trust')) return markPageSlots(html);
  const header = html.search(/<header\b[^>]*\bv17-header\b/i);
  if (header >= 0) html = html.slice(0, header) + TRUST_BAR_HTML + html.slice(header);
  else {
    const body = html.match(/<body\b[^>]*>/i);
    if (body) html = html.slice(0, body.index + body[0].length) + TRUST_BAR_HTML + html.slice(body.index + body[0].length);
  }
  return markPageSlots(html);
}

export function ensureFooterContact(input) {
  let html = String(input);
  const footerEnd = html.lastIndexOf('</footer>');
  if (footerEnd < 0) return markPageSlots(html);
  const footerStart = html.lastIndexOf('<footer', footerEnd);
  const footer = html.slice(footerStart, footerEnd);
  if (!footer.includes('bg-uniform-footer-contact')) html = html.slice(0, footerEnd) + renderFooterContact() + html.slice(footerEnd);
  return markPageSlots(html);
}

export function ensureBrandShellCss(input) {
  const html = String(input);
  if (html.includes('id="bg-canonical-brand-shell"')) return html;
  return html.replace('</head>', `${BRAND_SHELL_CSS}\n</head>`);
}
