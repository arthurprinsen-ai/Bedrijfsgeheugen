const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const KENNIS_HREF = `${ORIGIN}/kennis/`;
const BLOG_HREF = `${ORIGIN}/blog/`;

function absolutiseerInterneHref(html) {
  return String(html).replace(/href=(['"])\/(?!\/)([^'"]*)\1/gi, (_heel, quote, pad) => `href=${quote}${ORIGIN}/${pad}${quote}`);
}

export function ensureKnowledgeNavigation(input) {
  let html = absolutiseerInterneHref(input);

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
  const desktopKennis = bron.indexOf(`href="${KENNIS_HREF}"><b>Kennisbank</b>`);
  const desktopBlog = bron.indexOf(`href="${BLOG_HREF}"><b>Blog</b>`);
  const mobielKennis = bron.indexOf(`href="${KENNIS_HREF}">Kennisbank</a>`);
  const mobielBlog = bron.indexOf(`href="${BLOG_HREF}">Blog</a>`, mobielKennis);
  return desktopKennis >= 0 && desktopBlog > desktopKennis && mobielKennis >= 0 && mobielBlog > mobielKennis;
}
