import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import { publiekePaginas } from './cta-conversie.mjs';

/* Money-page blokken bij de build in de HTML in plaats van na het laden.
 *
 * Aanleiding (11 sept 2026): op /ai-scan zette assets/stijl.js ±0,4 s na het laden
 * een blok "Koopbeslissing in het kort" (prijs, doorlooptijd, knoppen; 432 px op
 * een telefoon) midden in de hero. Alles eronder schoof weg: CLS 0,10–0,13 op
 * telefoon en tablet, boven de grens van 0,1. Hetzelfde gold, kleiner, voor de
 * andere money-pagina's met een .inhoud-kop-hero.
 *
 * Eén bron: deze stap draait het money-page deel van assets/stijl.js zelf, in een
 * minimale nagebootste pagina, en zet het resultaat (stijlblok, hero-blok,
 * besliskader) op exact de plek waar stijl.js het zou zetten. In de browser ziet
 * stijl.js de blokken al staan en voegt niets meer toe; hij koppelt alleen de
 * klikmeting aan de knoppen. Alleen pagina's die stijl.js laden: waar de laag
 * vandaag niet draait, verandert er niets. */
export const PRERENDER_MARKER = 'data-bg-money-prerender';

function moneyBron(stijl) {
  const start = stijl.indexOf('/* Money-page conversion contract');
  if (start < 0) throw new Error('assets/stijl.js: money-page deel niet gevonden');
  const open = stijl.indexOf('(function(){', start);
  const eind = stijl.indexOf('\n})();', open);
  if (open < 0 || eind < 0) throw new Error('assets/stijl.js: money-page IIFE niet afgebakend');
  return stijl.slice(open, eind + 6);
}

// Einde van het element dat op positie i begint (i wijst naar '<'), of -1.
function elementEinde(html, i) {
  const m = /^<([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/.exec(html.slice(i));
  if (!m) return -1;
  const tag = m[1].toLowerCase(), na = i + m[0].length;
  if (m[2] === '/' || /^(img|br|hr|input|meta|link|source|wbr)$/.test(tag)) return na;
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi'); re.lastIndex = na;
  let diepte = 1, t;
  while ((t = re.exec(html))) { diepte += t[1] ? -1 : 1; if (!diepte) return re.lastIndex; }
  return -1;
}

// Interne links absoluut, zoals finalize-site-contracts ze maakt (0 normalisaties).
function nepElement(tag) {
  const attrs = {}; const kinderen = [];
  const el = {
    tagName: tag.toUpperCase(), attrs, kinderen, textContent: '', innerHTML: '', className: '', href: '',
    setAttribute(k, v) { attrs[k] = String(v); }, getAttribute(k) { return k in attrs ? attrs[k] : null; },
    addEventListener() {}, appendChild(k) { kinderen.push(k); return k; },
    querySelector(sel) { return sel === '.bg-money-actions' ? (el._acties ||= nepElement('div')) : null; },
    serialiseer() {
      const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      const a = { ...(el.className ? { class: el.className } : {}), ...(el.href ? { href: /^\/(?!\/)/.test(el.href) ? `https://www.bedrijfsgeheugen.nl${el.href}` : el.href } : {}), ...attrs };
      const open = `<${tag}${Object.entries(a).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')}>`;
      let binnen = el.innerHTML || esc(el.textContent);
      if (el._acties) binnen = binnen.replace('<div class="bg-money-actions"></div>', `<div class="bg-money-actions">${el._acties.kinderen.map(k => k.serialiseer()).join('')}</div>`);
      return open + binnen + `</${tag}>`;
    }
  };
  return el;
}

export function prerenderMoney(input, pad, stijlBron) {
  const html = String(input);
  if (html.includes(PRERENDER_MARKER) || !/<script[^>]+assets\/stijl\.js/.test(html)) return html;
  const mStart = html.search(/<main\b/i); const mEind = html.lastIndexOf('</main>');
  if (mStart < 0 || mEind < 0) return html;
  const mainHtml = html.slice(mStart, mEind);
  const uit = { stijl: null, hero: null, heroNa: null, besluit: null };
  const h1Start = mainHtml.search(/<h1\b/i);
  const main = {
    querySelector(sel) {
      // Een bestaande hero verrijkt stijl.js alleen met attributen en klikmeting;
      // dat blijft in de browser gebeuren (geen invloed op de opmaak).
      const bestaand = { setAttribute() {}, querySelectorAll: () => [] };
      if (sel === '.p-hero') return /class="[^"]*\bp-hero\b/.test(mainHtml) ? bestaand : null;
      if (sel === '.held[data-bg-component="hero"]') return /<[^>]*class="[^"]*\bheld\b[^"]*"[^>]*data-bg-component="hero"|<[^>]*data-bg-component="hero"[^>]*class="[^"]*\bheld\b/.test(mainHtml) ? bestaand : null;
      if (sel === 'h1' && h1Start > -1) {
        const h1Eind = elementEinde(mainHtml, h1Start);
        const volgende = mainHtml.slice(h1Eind).search(/\S/) + h1Eind;
        const heeftBroer = mainHtml[volgende] === '<' && mainHtml[volgende + 1] !== '/';
        const plek = heeftBroer ? elementEinde(mainHtml, volgende) : h1Eind;
        return { nextElementSibling: heeftBroer ? { insertAdjacentElement: (w, box) => { uit.hero = box; uit.heroNa = plek; } } : null,
                 insertAdjacentElement: (w, box) => { uit.hero = box; uit.heroNa = plek; } };
      }
      return null;
    },
    appendChild(box) { uit.besluit = box; },
    querySelectorAll: () => []
  };
  const document = {
    readyState: 'complete',
    querySelector: sel => (sel === 'main' ? main : null),
    getElementById: () => null,
    createElement: nepElement,
    head: { appendChild: s => { uit.stijl = s; } },
    addEventListener() {}
  };
  const location = { pathname: pad };
  vm.runInNewContext(moneyBron(stijlBron), { document, location, window: { dataLayer: [] } });
  if (!uit.stijl && !uit.hero && !uit.besluit) return html;
  const markeer = el => { el.setAttribute(PRERENDER_MARKER, ''); return el.serialiseer(); };
  let nieuwMain = mainHtml;
  if (uit.besluit) nieuwMain += markeer(uit.besluit);
  if (uit.hero && uit.heroNa > -1) nieuwMain = nieuwMain.slice(0, uit.heroNa) + markeer(uit.hero) + nieuwMain.slice(uit.heroNa);
  let nieuw = html.slice(0, mStart) + nieuwMain + html.slice(mEind);
  if (uit.stijl) nieuw = nieuw.replace(/<\/head>/i, `<style id="bgMoneyStyle" ${PRERENDER_MARKER}>${uit.stijl.textContent}</style>\n</head>`);
  return nieuw;
}

export function padVan(bestand) {
  const p = '/' + bestand.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
  return p.length > 1 ? p.replace(/\/$/, '') : '/';
}

export async function applyMoneyPrerender() {
  const stijl = await readFile('assets/stijl.js', 'utf8');
  let n = 0;
  for (const p of await publiekePaginas()) {
    const oud = await readFile(p, 'utf8');
    const nieuw = prerenderMoney(oud, padVan(p), stijl);
    if (nieuw !== oud) { await writeFile(p, nieuw); n++; }
  }
  console.log(`Money-page blokken vooraf in de HTML: ${n} pagina's`);
  return n;
}
