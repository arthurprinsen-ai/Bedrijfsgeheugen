const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const KENNIS_HREF = `${ORIGIN}/kennis`;
const BLOG_HREF = `${ORIGIN}/blog/`;

function absolutiseerInterneHref(html) {
  return String(html).replace(/href=(['"])\/(?!\/)([^'"]*)\1/gi, (_heel, quote, pad) => `href=${quote}${ORIGIN}/${pad}${quote}`);
}

function platteTekst(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normaliseerV18Navigatie(input) {
  let html = String(input);

  // De pinned V18-homepage gebruikt data-view="resources" voor de zichtbare
  // Kennis-controls. Maak die controls echte links vóór de latere chrome-pass.
  html = html.replace(/<button\b([^>]*\bdata-view="resources"[^>]*)>([\s\S]*?)<\/button>/gi, (heel, attrs, inhoud) => {
    if (platteTekst(inhoud).toLowerCase() !== 'kennis') return heel;
    const schoon = attrs.replace(/\s*type=(['"])button\1/gi, '').replace(/\s*href=(['"])[\s\S]*?\1/gi, '');
    return `<a href="${KENNIS_HREF}"${schoon}>${inhoud}</a>`;
  });

  // Als een eerdere stap de V18-control al naar /blog/ heeft omgezet, corrigeer
  // alleen de link waarvan de zichtbare tekst exact "Kennis" is.
  html = html.replace(/<a\b([^>]*)href=(['"])([^'"]*)\2([^>]*)>([\s\S]*?)<\/a>/gi, (heel, voor, quote, href, na, inhoud) => {
    const tekst = platteTekst(inhoud).toLowerCase();
    if (tekst === 'kennis') return `<a${voor}href="${KENNIS_HREF}"${na}>${inhoud}</a>`;
    if (tekst.startsWith('blog & kennisbank')) {
      const apart = inhoud.replace(/Blog\s*&amp;\s*kennisbank|Blog\s*&\s*kennisbank/i, 'Blog');
      return `<a${voor}href="${BLOG_HREF}"${na}>${apart}</a>`;
    }
    return heel;
  });

  return html;
}

export function ensureKnowledgeNavigation(input) {
  let html = absolutiseerInterneHref(input);
  html = normaliseerV18Navigatie(html);

  // Legacy/canonical bgkop blijft ondersteund voor pagina's die deze shell nog
  // rechtstreeks dragen. Kennisbank en Blog zijn daar twee aparte items.
  if (!html.includes(`href="${KENNIS_HREF}"><b>Kennisbank</b>`)) {
    html = html.replace(
      new RegExp(`<a href="${BLOG_HREF.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"><b>Blog<\\/b><span>Wat we tegenkomen, uitgelegd zonder jargon<\\/span><\\/a>`),
      `<a href="${KENNIS_HREF}"><b>Kennisbank</b><span>Gidsen, modellen en hulpmiddelen die blijvend bruikbaar zijn</span></a><a href="${BLOG_HREF}"><b>Blog</b><span>Wat we tegenkomen, uitgelegd zonder jargon</span></a>`
    );
  }

  if (!html.includes(`href="${KENNIS_HREF}">Kennisbank</a>`)) {
    html = html.replace(
      /(<button class="bgkop-macc"[^>]*>Kennis[\s\S]*?<\/button><div class="bgkop-mpaneel" hidden>)<a href="https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/">Blog<\/a>/,
      `$1<a href="${KENNIS_HREF}">Kennisbank</a><a href="${BLOG_HREF}">Blog</a>`
    );
  }

  return html;
}

export function verifyKnowledgeNavigation(html) {
  const bron = String(html);
  const anchors = [...bron.matchAll(/<a\b[^>]*href=(['"])([^'"]+)\1[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, , href, inhoud]) => ({ href, tekst: platteTekst(inhoud).toLowerCase() }));

  const v18Kennis = anchors.filter(link => link.tekst === 'kennis');
  const v18Blog = anchors.filter(link => link.tekst === 'blog' || link.tekst.startsWith('blog '));
  const v18Goed = v18Kennis.length > 0
    && v18Kennis.every(link => link.href === KENNIS_HREF)
    && v18Blog.some(link => link.href === BLOG_HREF)
    && !anchors.some(link => link.tekst.startsWith('blog & kennisbank'));

  const desktopKennis = bron.indexOf(`href="${KENNIS_HREF}"><b>Kennisbank</b>`);
  const desktopBlog = bron.indexOf(`href="${BLOG_HREF}"><b>Blog</b>`);
  const mobielKennis = bron.indexOf(`href="${KENNIS_HREF}">Kennisbank</a>`);
  const mobielBlog = bron.indexOf(`href="${BLOG_HREF}">Blog</a>`, mobielKennis);
  const legacyGoed = desktopKennis >= 0 && desktopBlog > desktopKennis && mobielKennis >= 0 && mobielBlog > mobielKennis;

  return v18Goed || legacyGoed;
}
