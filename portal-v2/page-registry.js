import { PORTAL_SECTIONS, PORTAL_PAGE_INDEX } from '../portal-next/portal-content-map.js';

export { PORTAL_SECTIONS, PORTAL_PAGE_INDEX };

export function listPortalGroups() {
  return Object.entries(PORTAL_SECTIONS).map(([id, section]) => ({
    id,
    label: section.label,
    pages: section.pages.map(pageId => ({ id:pageId, ...PORTAL_PAGE_INDEX[pageId] }))
  }));
}

export function findPage(pageId) {
  return PORTAL_PAGE_INDEX[pageId] || null;
}

export function buildLegacyUrl(pageId, klantSlug='ijsselmonde', base='https://www.bedrijfsgeheugen.nl/klantportaal') {
  const page = findPage(pageId);
  if (!page) return null;
  const url = new URL(base, 'https://www.bedrijfsgeheugen.nl');
  url.searchParams.set('klant', klantSlug || 'ijsselmonde');
  if (page.legacyTab) url.searchParams.set('tab', page.legacyTab);
  return url.toString();
}

export function allPageIds() {
  return Object.keys(PORTAL_PAGE_INDEX);
}
