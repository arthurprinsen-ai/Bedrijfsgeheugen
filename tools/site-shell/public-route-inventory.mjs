const ASSET_RE = /\.(?:png|jpe?g|webp|gif|svg|css|m?js|json|xml|txt|pdf|mp4|webm|ico|woff2?|ttf|eot)$/i;

export function routesFromSitemap(xml, baseUrl = 'https://www.bedrijfsgeheugen.nl') {
  const base = new URL(baseUrl);
  const routes = [];
  const seen = new Set();

  for (const match of String(xml || '').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    const raw = match[1].replace(/&amp;/g, '&').trim();
    let url;
    try { url = new URL(raw, base); } catch { continue; }
    if (url.origin !== base.origin) continue;
    if (ASSET_RE.test(url.pathname)) continue;

    let path = url.pathname || '/';
    if (path !== '/' && !path.startsWith('/blog/')) path = path.replace(/\/+$/, '');
    if (!seen.has(path)) {
      seen.add(path);
      routes.push(path);
    }
  }

  return routes;
}
