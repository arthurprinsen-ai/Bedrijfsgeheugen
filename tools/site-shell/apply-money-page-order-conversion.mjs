import { readFile, writeFile } from 'node:fs/promises';

export const MONEY_PAGE_ORDER_CONVERSION_VERSION = 'money-page-order-conversion-v2';

const pages = [
  'index.html',
  'prijzen.html',
  'product.html',
  'bedrijfsprocessen-automatiseren.html',
  'afas-koppeling.html',
  'exact-online-koppeling.html',
  'api-koppeling-laten-maken.html',
  'power-bi-implementatie.html',
  'ai-automatisering-mkb.html',
];

function addAttr(tag, name) {
  if (new RegExp(`\\s${name}(?:\\s|=|>)`, 'i').test(tag)) return tag;
  return tag.replace(/^<a\b/i, `<a ${name}`);
}

function replaceAnchorByText(html, textPattern, { href, text, attr }) {
  let changed = false;
  const out = html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, tag => {
    const visible = tag.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (changed || !textPattern.test(visible)) return tag;
    let next = tag.replace(/\bhref=(?:"[^"]*"|'[^']*')/i, `href="${href}"`);
    if (attr) next = addAttr(next, attr);
    next = next.replace(/>([\s\S]*?)<\/a>$/i, `>${text}</a>`);
    changed = true;
    return next;
  });
  return { html: out, changed };
}

function transformHome(input) {
  let html = String(input);
  if (/data-money-primary[^>]+href=["'](?:https:\/\/www\.bedrijfsgeheugen\.nl)?\/zelfscan["']/i.test(html) && /Geen formulier\\. Geen e-mail\\. Geen verplichting\\. Meteen resultaat\\./i.test(html)) return html;

  const homeStart = html.indexOf('id="view-home"');
  if (homeStart < 0) throw new Error('money-page conversion: generated homepage view-home not found');
  const homeEnd = html.indexOf('</main>', homeStart);
  if (homeEnd < 0) throw new Error('money-page conversion: generated homepage main boundary not found');

  let scope = html.slice(homeStart, homeEnd);
  const primary = replaceAnchorByText(scope, /^Doe de gratis zelfscan$/i, {
    href: 'https://www.bedrijfsgeheugen.nl/zelfscan',
    text: 'Ontdek gratis waar je bedrijf lekt →',
    attr: 'data-money-primary',
  });
  if (!primary.changed) throw new Error('money-page conversion: homepage hero primary CTA anchor not found');
  scope = primary.html;

  const secondary = replaceAnchorByText(scope, /^Bereken je verlies$/i, {
    href: 'https://www.bedrijfsgeheugen.nl/portal-v2/',
    text: 'Bekijk het portaal',
    attr: 'data-money-secondary',
  });
  if (!secondary.changed) throw new Error('money-page conversion: homepage hero secondary CTA anchor not found');
  scope = secondary.html;

  const marker = '<p data-money-risk-reversal="true"><strong>Geen formulier. Geen e-mail. Geen verplichting. Meteen resultaat.</strong> In 3 minuten zie je je Bedrijfslek-score, grootste risico’s en drie concrete acties. Daarna beslis je pas of je verder wilt.</p>';
  const secondaryIndex = scope.indexOf('data-money-secondary');
  const secondaryClose = scope.indexOf('</a>', secondaryIndex);
  if (secondaryClose < 0) throw new Error('money-page conversion: homepage secondary CTA close not found');
  scope = scope.slice(0, secondaryClose + 4) + marker + scope.slice(secondaryClose + 4);

  return html.slice(0, homeStart) + scope + html.slice(homeEnd);
}

function transformProduct(input) {
  let html = String(input);
  if (/data-money-primary[^>]+href=["']\/frisse-blik["']/i.test(html) && /30 minuten, geen verplichting/i.test(html)) return html;

  const mainStart = html.indexOf('<main');
  const mainEnd = html.indexOf('</main>', mainStart);
  if (mainStart < 0 || mainEnd < 0) throw new Error('money-page conversion: generated product main not found');

  let scope = html.slice(mainStart, mainEnd);
  const introNeedle = '<p class="intro">';
  const introStart = scope.indexOf(introNeedle);
  if (introStart < 0) throw new Error('money-page conversion: generated product intro not found');
  const introEnd = scope.indexOf('</p>', introStart);
  if (introEnd < 0) throw new Error('money-page conversion: generated product intro close not found');

  const block = `
<div class="bg-money-order-path" data-money-order-path="${MONEY_PAGE_ORDER_CONVERSION_VERSION}">
  <a class="btn btn-primary" data-money-primary href="/frisse-blik">Plan gratis een Frisse Blik →</a>
  <a class="btn" data-money-secondary href="/portal-v2/">Bekijk eerst het portaal</a>
  <p><strong>30 minuten, geen verplichting.</strong> We toetsen eerst of kennisborging, koppelingen of stuurinformatie voor jouw situatie voldoende waarde opleveren. Alleen bij voldoende fit volgt een betaalde vervolgstap.</p>
</div>`;
  scope = scope.slice(0, introEnd + 4) + block + scope.slice(introEnd + 4);
  return html.slice(0, mainStart) + scope + html.slice(mainEnd);
}

function hasPrimary(html, path) {
  if (path === 'index.html') return /data-money-primary[^>]+href=["'](?:https:\/\/www\.bedrijfsgeheugen\.nl)?\/zelfscan["']/i.test(html);
  return /data-money-primary[^>]+href=["'](?:https:\/\/www\.bedrijfsgeheugen\.nl)?\/frisse-blik["']/i.test(html);
}

export async function applyMoneyPageOrderConversion() {
  const results = [];
  for (const path of pages) {
    let html = await readFile(path, 'utf8');
    if (path === 'index.html') html = transformHome(html);
    if (path === 'product.html') html = transformProduct(html);

    if (!hasPrimary(html, path)) {
      throw new Error(`${path}: final built money page has no valid primary conversion CTA`);
    }
    if (!/geen verplichting/i.test(html)) {
      throw new Error(`${path}: final built money page has no explicit risk reversal`);
    }
    if (/data-money-primary[^>]+href=["'][^"']*\/contact/i.test(html)) {
      throw new Error(`${path}: generic contact remains primary CTA`);
    }

    if (!html.includes(`data-money-order-contract="${MONEY_PAGE_ORDER_CONVERSION_VERSION}"`)) {
      html = html.replace(/<body\b([^>]*)>/i, (_m, attrs) =>
        `<body${attrs} data-money-order-contract="${MONEY_PAGE_ORDER_CONVERSION_VERSION}">`
      );
    }
    await writeFile(path, html, 'utf8');
    results.push(path);
  }
  console.log(`Money-page order conversion applied after final V18 generation: ${results.length} pages`);
  return results;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  await applyMoneyPageOrderConversion();
}
