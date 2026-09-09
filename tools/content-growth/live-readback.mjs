export function verifyLivePublication({ html, status, url, contentId, slug }) {
  if (Number(status) !== 200) throw new Error(`live status must be 200, got ${status}`);
  if (!html || typeof html !== 'string') throw new Error('live html is required');
  const expected = `https://www.bedrijfsgeheugen.nl/blog/${slug}/`;
  if (url && !String(url).startsWith(expected)) throw new Error(`url mismatch: ${url}`);
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/i)?.[1]
    || html.match(/<link\s+href=["']([^"']+)["']\s+rel=["']canonical["'][^>]*>/i)?.[1];
  if (canonical !== expected) throw new Error(`canonical mismatch: expected ${expected}, got ${canonical || 'missing'}`);
  const marker = `data-content-id="${contentId}"`;
  const markerSingle = `data-content-id='${contentId}'`;
  if (!html.includes(marker) && !html.includes(markerSingle)) throw new Error(`content_id marker missing: ${contentId}`);
  if (!/<h1(?:\s|>)/i.test(html)) throw new Error('article h1 missing');
  if (!/application\/ld\+json/i.test(html)) throw new Error('article JSON-LD missing');
  return { ok: true, status: 200, url: expected, content_id: contentId, slug, canonical };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [url, contentId, slug] = process.argv.slice(2);
  if (!url || !contentId || !slug) {
    console.error('usage: node tools/content-growth/live-readback.mjs <url> <content_id> <slug>');
    process.exit(2);
  }
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}bg_readback=${Date.now()}`, { headers: { 'cache-control': 'no-cache' } });
  const html = await response.text();
  const proof = verifyLivePublication({ html, status: response.status, url, contentId, slug });
  console.log(JSON.stringify(proof));
}
