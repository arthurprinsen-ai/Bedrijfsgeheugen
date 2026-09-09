export function blogContentId(slug) {
  if (!/^[a-z0-9-]+$/.test(String(slug || ''))) throw new Error('invalid blog slug');
  return `blog:${slug}`;
}

export function instrumentBlogHtml(html, slug) {
  const contentId = blogContentId(slug);
  if (html.includes('data-content-id=')) return html.replace(/data-content-id=["'][^"']+["']/, `data-content-id="${contentId}"`);
  return html.replace(/<body(\s|>)/i, (match, tail) => `<body data-content-id="${contentId}"${tail}`);
}
