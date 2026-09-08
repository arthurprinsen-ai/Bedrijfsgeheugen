import { readFile, writeFile } from 'node:fs/promises';
import { normaliseerAllePaginas } from './normaliseer-site-ui.mjs';
import { controleerSiteUi } from './controleer-site-ui.mjs';
import { genereerSitemap } from './genereer-sitemap.mjs';
import { controleerTechnischeSeo } from './controleer-technische-seo.mjs';
import { applySeoOrderEngine } from './seo-order-engine/apply.mjs';
import { validateSeoOrderEngine } from './seo-order-engine/validate.mjs';
import { applyHomepageAutomationLayout } from './fix-homepage-automation-layout.mjs';
import { applyHomepageContextSliderReadability } from './site-shell/fix-homepage-context-slider.mjs';

// De homepage-app had een eigen prijzenweergave met verouderde bedragen.
// /prijzen is sinds 2 september 2026 een eigen contentpagina binnen dezelfde
// canonical merk-shell. Na de page-policy volgt nu één centrale SEO-order
// enrichment. Sitemap, UI, technische SEO en de commerciële intent/link/blog
// contracten worden daarna op exact dezelfde gebouwde output gecontroleerd.

const DOEL = 'https://www.bedrijfsgeheugen.nl/prijzen';

const BLOK = `<div class="pagehero"><div class="wrap"><span class="eyebrow">Prijzen</span>
<h2>De prijzen staan op een eigen pagina.</h2>
<p>Vier pakketten, van &euro; 99 per maand tot een prijs op maat, met per pakket wat de AI voor je doet en hoe vers je gegevens zijn.</p>
<p><a class="btn btn-primary" href="${DOEL}">Bekijk de prijzen &rarr;</a></p></div></div>`;

// Finale endpoint-policy. Dit blok staat bewust ná alle homepage-builders zodat
// oudere slider-CSS de richting of het bereik niet opnieuw kan omdraaien.
// 0–8% snapt visueel naar 0%; 92–100% snapt naar 100%. Daardoor zijn de
// volledige teksten ook op iPhone praktisch bereikbaar zonder de schermrand
// exact te hoeven raken.
const SLIDER_ENDPOINT_STYLE = `<style data-bg-compare-slider-endpoints>
[data-bg-compare-slider]{--bg-final-split:var(--split,50%);position:relative!important;overflow:hidden!important;touch-action:pan-y}
[data-bg-compare-slider]:has(.compare-knob:is([aria-valuenow="0"],[aria-valuenow="1"],[aria-valuenow="2"],[aria-valuenow="3"],[aria-valuenow="4"],[aria-valuenow="5"],[aria-valuenow="6"],[aria-valuenow="7"],[aria-valuenow="8"])){--bg-final-split:0%}
[data-bg-compare-slider]:has(.compare-knob:is([aria-valuenow="92"],[aria-valuenow="93"],[aria-valuenow="94"],[aria-valuenow="95"],[aria-valuenow="96"],[aria-valuenow="97"],[aria-valuenow="98"],[aria-valuenow="99"],[aria-valuenow="100"])){--bg-final-split:100%}
[data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important}
[data-bg-compare-slider] .compare-before{clip-path:inset(0 calc(100% - var(--bg-final-split,50%)) 0 0)!important}
[data-bg-compare-slider] .compare-after{clip-path:inset(0 0 0 var(--bg-final-split,50%))!important}
[data-bg-compare-slider] .compare-handle{display:block!important;position:absolute!important;left:clamp(24px,var(--bg-final-split,50%),calc(100% - 24px))!important;z-index:20!important}
@media(max-width:720px){
  [data-bg-compare-slider]{min-height:360px!important}
  [data-bg-compare-slider] .compare-before .compare-copy{margin-left:0!important;margin-right:auto!important;padding-right:18px!important}
  [data-bg-compare-slider] .compare-after .compare-copy{margin-left:auto!important;margin-right:0!important;padding-left:18px!important}
}
</style>`;

function vervangWeergave(html) {
  const open = '<div class="page" id="view-pricing">';
  const start = html.indexOf(open);
  if (start === -1) return html;
  const na = html.indexOf('<div class="page" id="view-', start + open.length);
  const eind = na === -1 ? html.indexOf('</main>', start) : na;
  if (eind === -1) return html;
  return html.slice(0, start) + open + '\n' + BLOK + '\n</div>\n' + html.slice(eind);
}

function knoppenNaarLink(html) {
  return html.replace(/<button([^>]*?)data-view="pricing"([^>]*?)>([\s\S]*?)<\/button>/g,
    (heel, voor, na, inhoud) => {
      const attrs = (voor + na).replace(/\s*type="button"/g, '').replace(/\s+$/, '');
      return `<a href="${DOEL}"${attrs}>${inhoud}</a>`;
    });
}

function forceCompareCopyWidth(html) {
  const rule = 'width:min(460px,calc(100% - 36px))!important;max-width:none!important;box-sizing:border-box!important';
  return html.replace(/<([a-z][\w:-]*)([^>]*\bclass=(['"])[^'"]*\bcompare-copy\b[^'"]*\3[^>]*)>/gi, (whole, tag, attrs) => {
    let nextAttrs = attrs;
    if (/\bstyle=(['"])/i.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/\bstyle=(['"])([\s\S]*?)\1/i, (_m, quote, style) => `style=${quote}${style.replace(/;?\s*$/, ';')}${rule}${quote}`);
    } else {
      nextAttrs += ` style="${rule}"`;
    }
    return `<${tag}${nextAttrs}>`;
  });
}

function borgStatischeSliderEndpoints(input) {
  let html = String(input);
  html = html.replace(/<([a-z][\w:-]*)([^>]*\bid=(['"])compareSlider\3[^>]*)>/gi, (heel, tag, attrs) => {
    if (/\bdata-bg-compare-slider\b/i.test(attrs)) return heel;
    return `<${tag}${attrs} data-bg-compare-slider>`;
  });
  html = html.replace(/<([a-z][\w:-]*)([^>]*\bclass=(['"])[^'"]*\bcompare-slider\b[^'"]*\3[^>]*)>/gi, (heel, tag, attrs) => {
    if (/\bdata-bg-compare-slider\b/i.test(attrs)) return heel;
    return `<${tag}${attrs} data-bg-compare-slider>`;
  });
  html = forceCompareCopyWidth(html);
  html = html.replace(/<style\s+data-bg-compare-slider-endpoints\b[^>]*>[\s\S]*?<\/style>\s*/gi, '');
  html = html.replace('</head>', `${SLIDER_ENDPOINT_STYLE}\n</head>`);
  return html;
}

export async function bouwPrijsVerwijzing() {
  let gedaan = 0;
  for (const bestand of ['index.html', 'prototype-v18-stable.html']) {
    let html;
    try { html = await readFile(bestand, 'utf8'); } catch { continue; }
    const nieuw = knoppenNaarLink(vervangWeergave(html));
    if (nieuw !== html) { await writeFile(bestand, nieuw, 'utf8'); gedaan++; }
  }
  console.log(`Oude prijzenweergave uit de homepage gehaald: ${gedaan} bestand(en)`);
  return gedaan;
}

async function borgHomepageAutomationLayout() {
  const html = await readFile('index.html', 'utf8');
  const next = applyHomepageAutomationLayout(html);
  await writeFile('index.html', next, 'utf8');
}

async function borgHomepageContextSlider() {
  const html = await readFile('index.html', 'utf8');
  const next = borgStatischeSliderEndpoints(applyHomepageContextSliderReadability(html));
  await writeFile('index.html', next, 'utf8');
}

export async function voerPricingShellPipelineUit(stage = 'all') {
  if (stage === 'all' || stage === 'rewrite') await bouwPrijsVerwijzing();
  if (stage === 'all' || stage === 'normalize') {
    await normaliseerAllePaginas();
    await applySeoOrderEngine();
    await borgHomepageAutomationLayout();
    await borgHomepageContextSlider();
  }
  if (stage === 'all' || stage === 'verify') {
    await import('./bouw-v18-homepage-platform-expertise-toggle.mjs');
    await import('./bouw-v18-homepage-scroll-story.mjs');
    await borgHomepageContextSlider();
    await genereerSitemap();
    await controleerSiteUi();
    await controleerTechnischeSeo();
    await validateSeoOrderEngine();
  }
}

const stage = process.env.BG_PRICING_STAGE || 'all';
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await voerPricingShellPipelineUit(stage);
}
