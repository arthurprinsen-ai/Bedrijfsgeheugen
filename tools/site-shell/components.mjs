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
@media(min-width:641px) and (max-width:1024px){.bg-uniform-trust{height:39px;min-height:39px;max-height:39px;overflow:hidden;box-sizing:border-box}.bg-uniform-trust-in{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));height:38px;min-height:38px;max-height:38px;box-sizing:border-box;gap:12px}.bg-uniform-trust-in span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;line-height:18px}}\n@media(max-width:640px){.bg-uniform-trust{font-size:12px}.bg-uniform-trust-in{display:grid;grid-template-columns:1fr;grid-template-rows:repeat(3,16px);justify-content:stretch;align-items:center;padding:8px 18px;gap:5px;min-height:64px;box-sizing:border-box}.bg-uniform-trust-in span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:16px}}

/* Mobile first-screen contract: one navigational control, readable proposition and unobstructed content. */
@media(max-width:700px){
  .bg-uniform-trust,.bgtop,.announcement{display:none!important}
  header.v17-header{position:sticky!important;top:0!important;z-index:1100!important;min-height:64px!important;height:64px!important;max-height:64px!important}
  header.v17-header .v17-nav{width:100%!important;max-width:100%!important;min-height:64px!important;height:64px!important;max-height:64px!important;padding:0 16px!important;gap:10px!important;display:flex!important;align-items:center!important;justify-content:space-between!important}
  header.v17-header .v17-nav>.brand{flex:1 1 auto!important;min-width:0!important;max-width:calc(100% - 80px)!important;font-size:clamp(16px,4.8vw,21px)!important;letter-spacing:-.035em!important;line-height:1.1!important;white-space:nowrap!important;text-overflow:ellipsis!important;overflow:hidden!important}
  header.v17-header .brand .bg-mobile-ornament-hidden{display:none!important}
  header.v17-header .v17-nav>.mobile-toggle{flex:0 0 65px!important;min-width:65px!important;max-width:65px!important;width:65px!important;height:42px!important;min-height:42px!important;display:inline-flex!important;justify-content:center!important;align-items:center!important;padding:0!important;margin:0!important;border:1px solid rgba(255,255,255,.27)!important;border-radius:11px!important;background:#22262d!important;color:#fff!important;box-shadow:none!important;font-size:0!important}
  header.v17-header .v17-nav>.mobile-toggle>*{display:none!important}
  header.v17-header .v17-nav>.mobile-toggle::before{content:none!important}
  header.v17-header .v17-nav>.mobile-toggle::after{content:"Menu"!important;font:700 13px/1 'Instrument Sans',system-ui,sans-serif!important;color:#fff!important;letter-spacing:0!important}
  header.v17-header .v17-nav>.mobile-toggle[aria-expanded="true"]::after{content:"Sluit"!important}
  header.v17-header .v17-nav>.mobile-toggle:focus-visible{outline:3px solid #FFE86B!important;outline-offset:2px!important}
  main [data-bg-daily-steering-title="v2"]{font-size:clamp(32px,8.8vw,43px)!important;line-height:1.09!important;letter-spacing:-.048em!important;max-width:100%!important;overflow-wrap:normal!important;word-break:normal!important;hyphens:none!important;text-wrap:pretty!important}
  main [data-bg-daily-steering-title="v2"] .mark{display:inline!important;background:transparent!important;background-image:none!important;box-shadow:none!important;border:0!important;padding:0!important;margin:0!important;color:#FFE86B!important;line-height:inherit!important;white-space:normal!important;word-break:normal!important;overflow-wrap:normal!important;transform:none!important}
  main [data-bg-daily-steering-title="v2"] .mark::before,main [data-bg-daily-steering-title="v2"] .mark::after{content:none!important;display:none!important}
  .paginakop,.inhoud-kop{padding-top:36px!important;padding-bottom:40px!important}
  .paginakop h1,.inhoud-kop h1{font-size:clamp(30px,8.5vw,42px)!important;line-height:1.13!important;letter-spacing:-.04em!important;overflow-wrap:normal!important;hyphens:none!important;max-width:100%!important}
  .paginakop p,.inhoud-kop p{font-size:16px!important;line-height:1.55!important}
  .bg-whatsapp-contact{right:14px!important;bottom:18px!important}
}
</style>`;

export function renderFooterContact() {
  return `<div class="bg-uniform-footer-contact"><span>Bedrijfsgeheugen · Enschede</span><a href="mailto:arthur@bedrijfsgeheugen.nl">arthur@bedrijfsgeheugen.nl</a><a href="tel:+31627483345">06 27 48 33 45</a><span>ma–vr 08:00–18:00</span></div>`;
}

export const WHATSAPP_URL = 'https://wa.me/31627483345?text=Hoi%20Arthur%2C%20ik%20heb%20een%20vraag%20over%20Bedrijfsgeheugen.nl';

export const WHATSAPP_CONTACT_HTML = `<style id="bg-whatsapp-contact-style">
.bg-whatsapp-contact{position:fixed;right:22px;bottom:22px;z-index:100000;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:#25D366;color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.22);text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
.bg-whatsapp-contact:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 14px 34px rgba(0,0,0,.28)}
.bg-whatsapp-contact:focus-visible{outline:3px solid #fff;outline-offset:3px;box-shadow:0 0 0 6px #1f6fff,0 10px 28px rgba(0,0,0,.22)}
.bg-whatsapp-contact svg{width:31px;height:31px;display:block;fill:currentColor}
@media(max-width:520px){.bg-whatsapp-contact{right:14px;bottom:14px;width:54px;height:54px}body:has(#bgCookie.bgShow) .bg-whatsapp-contact{bottom:154px}}
@media(prefers-reduced-motion:reduce){.bg-whatsapp-contact{transition:none}}
</style>
<a class="bg-whatsapp-contact" data-bg-component="whatsapp-contact" href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp met Arthur" title="WhatsApp met Arthur">
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M19.11 17.21c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.18-1.35-.81-.72-1.35-1.61-1.51-1.88-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.98 2.63 1.11 2.81.14.18 1.92 2.94 4.65 4.12.65.28 1.16.45 1.56.58.66.21 1.25.18 1.72.11.52-.08 1.6-.66 1.83-1.29.23-.63.23-1.18.16-1.29-.07-.11-.25-.18-.52-.32M16.04 5.33a10.5 10.5 0 0 0-8.93 16.02L5.62 26.8l5.58-1.46a10.49 10.49 0 1 0 4.84-20.01m0 18.98c-1.53 0-3.03-.41-4.34-1.19l-.31-.19-3.31.87.88-3.23-.2-.33A8.48 8.48 0 1 1 16.04 24.31"/></svg>
</a>`;

export function ensureWhatsAppContact(input) {
  const html = String(input);
  if (html.includes('data-bg-component="whatsapp-contact"')) return html;
  return html.replace('</body>', `${WHATSAPP_CONTACT_HTML}\n</body>`);
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
  if (html.includes('data-bg-component="trustbar"') || /<[^>]+class=["'][^"']*\bbg-uniform-trust\b[^"']*["'][^>]*>/i.test(html)) return markPageSlots(html);
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
