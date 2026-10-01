import { readFile, writeFile, glob } from 'node:fs/promises';
import {
  VRAAGBALK, VRAAG_CSS, VRAAG_JS,
  MODULE_CSS, MODULE_JS, bouwModules,
  CONTEXT_CSS, CONTEXT_JS, rolblok
} from './v18-modules.mjs';
import {
  ensureTrustBar, ensureFooterContact, ensureBrandShellCss, markPageSlots, extractComponent
} from './site-shell/components.mjs';
import { applyCanonicalShellToAllPages, projectGlobalComponents } from './site-shell/apply-shell.mjs';
import { ensureReleaseMarker } from './site-shell/release-marker.mjs';
import { applyHomepageContextSliderReadability } from './site-shell/fix-homepage-context-slider.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';

function absolutiseerInterneHref(html) {
  return String(html).replace(/href=(['"])\/(?!\/)([^'"]*)\1/gi, (_heel, quote, pad) => `href=${quote}${ORIGIN}/${pad}${quote}`);
}

function herstelTechnischeLinks(html) {
  return String(html)
    .replaceAll(`${ORIGIN}/wachtwoord-vergeten`, `${ORIGIN}/inloggen`)
    .replaceAll(`${ORIGIN}/blog/afas-koppeling/`, `${ORIGIN}/afas-koppeling`)
    .replaceAll('href="/wachtwoord-vergeten"', 'href="/inloggen"')
    .replaceAll('href="/blog/afas-koppeling/"', 'href="/afas-koppeling"');
}

function verwijderDefecteLegacyDemonstrator(input) {
  return String(input).replace(/<script\b([^>]*)>([\s\S]*?)<\/script>\s*/gi, (heel, attrs, body) => {
    if (/\bsrc\s*=/i.test(attrs)) return heel;
    const isLegacyDemonstrator = body.includes('Animated demonstrator only; production should bind to validated savings data')
      && body.includes('Actions in hero animate as if the workflow was executed');
    return isLegacyDemonstrator ? '' : heel;
  });
}

function maakWijzigingenStapnavigatieNullSafe(input, bestand) {
  if (bestand !== 'wijzigingen-uitgelegd.html') return String(input);
  let html = String(input);
  html = html.replace(
    "    vorige.disabled = nu === 0;\n    volgende.disabled = nu === panelen.length - 1;\n    volgende.textContent = nu === panelen.length - 1 ? 'Klaar' : 'Volgende';\n    telling.textContent = (nu + 1) + ' van ' + panelen.length;",
    "    if (vorige) vorige.disabled = nu === 0;\n    if (volgende) {\n      volgende.disabled = nu === panelen.length - 1;\n      volgende.textContent = nu === panelen.length - 1 ? 'Klaar' : 'Volgende';\n    }\n    if (telling) telling.textContent = (nu + 1) + ' van ' + panelen.length;"
  );
  html = html.replace(
    "  vorige.addEventListener('click', function(){ toon(nu - 1); });\n  volgende.addEventListener('click', function(){ toon(nu + 1); });",
    "  if (vorige) vorige.addEventListener('click', function(){ toon(nu - 1); });\n  if (volgende) volgende.addEventListener('click', function(){ toon(nu + 1); });"
  );
  return html;
}

function openDivMetKlasse(html, klasse, vanaf = 0) {
  const re = /<div\b[^>]*class="[^"]*"[^>]*>/gi;
  re.lastIndex = vanaf;
  let m;
  while ((m = re.exec(html))) {
    const cm = m[0].match(/class="([^"]*)"/i);
    if (cm && cm[1].split(/\s+/).includes(klasse)) return { index: m.index, endOpen: re.lastIndex };
  }
  return null;
}

function divEinde(html, open) {
  const tags = /<div\b[^>]*>|<\/div\s*>/gi;
  tags.lastIndex = open.index;
  let diepte = 0, m;
  while ((m = tags.exec(html))) {
    if (/^<div\b/i.test(m[0])) diepte++; else diepte--;
    if (diepte === 0) return tags.lastIndex;
  }
  return -1;
}

function verwijderDivMetKlasse(input, klasse) {
  let html = input;
  while (true) {
    const open = openDivMetKlasse(html, klasse);
    if (!open) break;
    const eind = divEinde(html, open);
    if (eind < 0) break;
    html = html.slice(0, open.index) + html.slice(eind);
  }
  return html;
}

function heeftElementMetKlasse(html, klasse) {
  const veilig = klasse.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<[^>]+class="[^"]*(?:^|\\s)${veilig}(?:\\s|$)[^"]*"[^>]*>`, 'i');
  return re.test(String(html));
}

function ensurePubliekeSeoBasis(input, bestand) {
  let html = String(input);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const robots = [...head.matchAll(/<meta\b[^>]*name=(?:"robots"|'robots')[^>]*>/gi)];
  if (robots.length === 0) {
    html = html.replace('</head>', '<meta name="robots" content="index,follow">\n</head>');
  }
  if (bestand !== 'index.html') {
    const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
    const hasBreadcrumb = /<(?:nav|ol)\b[^>]*(?:aria-label=(?:"Kruimelpad"|'Kruimelpad')|class=(?:"[^"]*\bbgkruim\b[^"]*"|'[^']*\bbgkruim\b[^']*'))[^>]*>/i.test(body);
    if (!hasBreadcrumb) {
      const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
      const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
      const raw = (h1?.[1] || title?.[1] || bestand.replace(/\.html$/,'')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      const label = raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const breadcrumb = '<nav class="bgkruim" aria-label="Kruimelpad"><a href="https://www.bedrijfsgeheugen.nl/">Home</a><span aria-hidden="true">›</span><span aria-current="page">'+label+'</span></nav>';
      html = html.replace(/<main\b([^>]*)>/i, '<main$1>'+breadcrumb);
    }
  }
  return html;
}

function markeerPricingTools(input) {
  let html = input;
  html = html.replace(/<section\b(?![^>]*data-bg-component)([^>]*\bclass="[^"]*\bbg-pricing-tools\b[^"]*"[^>]*)>/i,
    '<section$1 data-bg-component="page-tools">');
  return html;
}

function pricingTools(input) {
  let html = input;
  const compleet = ['bgx-vraagbalk', 'bgx-rekenaar', 'bgx-rol'].every(k => heeftElementMetKlasse(html, k));
  if (!compleet) {
    const { body: rekenaar } = bouwModules('');
    const blok = `<section class="bg-pricing-tools" data-bg-component="page-tools" aria-label="Interactieve prijsinstrumenten"><div class="wrap">${VRAAGBALK}${rekenaar}${rolblok('prijzen')}</div></section>`;
    const mainEind = html.indexOf('</main>');
    html = mainEind >= 0 ? html.slice(0, mainEind) + blok + html.slice(mainEind) : html.replace('</body>', blok + '</body>');
  }
  html = markeerPricingTools(html);
  if (!html.includes('id="v18-vraag"')) html = html.replace('</head>', VRAAG_CSS + '\n' + MODULE_CSS + '\n' + CONTEXT_CSS + '\n</head>');
  if (!html.includes('id="v18-vraag-js"')) html = html.replace('</body>', VRAAG_JS + '\n' + MODULE_JS + '\n' + CONTEXT_JS + '\n</body>');
  return html;
}

export function normaliseerHtml(input, bestand) {
  const isPrijzen = bestand === 'prijzen.html';
  let html = verwijderDefecteLegacyDemonstrator(input);
  html = maakWijzigingenStapnavigatieNullSafe(html, bestand);

  html = verwijderDivMetKlasse(html, 'bgx-gegevens');
  if (isPrijzen) {
    html = pricingTools(html);
  } else {
    html = verwijderDivMetKlasse(html, 'bgx-vraagbalk');
    html = verwijderDivMetKlasse(html, 'bgx-rekenaar');
    html = verwijderDivMetKlasse(html, 'bgx-rol');
    html = html.replace(/<section\b[^>]*data-bg-component="page-tools"[^>]*>\s*<\/section>/gi, '');
  }

  html = ensureTrustBar(html);
  html = ensureFooterContact(html);
  html = ensureBrandShellCss(html);
  html = ensurePubliekeSeoBasis(html, bestand);
  html = ensureReleaseMarker(html);
  html = markPageSlots(html);
  html = absolutiseerInterneHref(html);
  html = herstelTechnischeLinks(html);
  html = applyHomepageContextSliderReadability(html);
  return html;
}

const MAG_NIET = new Set(['index-oud.html', 'prototype-v18-stable.html', 'klantportaal.html', 'klantportaal-demo.html', 'klant-login.html']);
const EXTRA_PUBLIC_INDEX_PAGES = Object.freeze([
  'openai-ai-modellen/index.html',
  'claude-ai-modellen/index.html',
  'gemini-ai-modellen/index.html',
  'mistral-ai-modellen/index.html',
  'amazon-ai-modellen/index.html',
  'chatgpt-vs-claude/index.html',
  'chatgpt-vs-gemini/index.html',
  'claude-vs-gemini/index.html'
]);

export async function normaliseerAllePaginas() {
  await applyCanonicalShellToAllPages();
  const canonicalSource = normaliseerHtml(await readFile('over-ons.html', 'utf8'), 'over-ons.html');

  const bestanden = [];
  for await (const p of glob('*.html')) if (!MAG_NIET.has(p)) bestanden.push(p);
  for await (const p of glob('blog/*/index.html')) bestanden.push(p);
  bestanden.push('blog/index.html');
  bestanden.push(...EXTRA_PUBLIC_INDEX_PAGES);

  let gewijzigd = 0;
  for (const bestand of [...new Set(bestanden)]) {
    let html; try { html = await readFile(bestand, 'utf8'); } catch { continue; }
    if (!html.includes('<body')) continue;

    let voorbereid = normaliseerHtml(html, bestand);
    if (['pakketadvies.html','portaal-demo.html'].includes(bestand) && !voorbereid.includes('data-bg-component="mobile-menu"')) {
      const mobielMenu = extractComponent(canonicalSource, 'mobile-menu');
      if (!mobielMenu) throw new Error(`${bestand}: canonical mobile-menu ontbreekt in bron`);
      const mainStart = voorbereid.search(/<main\b/i);
      voorbereid = mainStart >= 0
        ? voorbereid.slice(0, mainStart) + mobielMenu + '\n' + voorbereid.slice(mainStart)
        : voorbereid.replace('</body>', mobielMenu + '\n</body>');
    }
    let metMerkcomponenten;
    try {
      metMerkcomponenten = bestand === 'over-ons.html'
        ? voorbereid
        : projectGlobalComponents(voorbereid, canonicalSource);
    } catch (error) {
      throw new Error(`${bestand}: finale globale componentprojectie: ${error.message}`);
    }

    const nieuw = normaliseerHtml(metMerkcomponenten, bestand);
    if (nieuw !== html) { await writeFile(bestand, nieuw, 'utf8'); gewijzigd++; }
  }
  console.log(`Canonical site-UI policy toegepast op ${gewijzigd} pagina's; globale merkcomponenten finale keer geprojecteerd`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) await normaliseerAllePaginas();
