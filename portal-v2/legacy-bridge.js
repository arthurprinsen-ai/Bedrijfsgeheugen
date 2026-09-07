import { findPage, buildLegacyUrl } from './page-registry.js';

export function customerSlug(search=globalThis.location?.search || '') {
  return new URLSearchParams(search).get('klant') || 'ijsselmonde';
}

export function canEmbedLegacy(locationObj=globalThis.location) {
  return Boolean(locationObj && /(^|\.)bedrijfsgeheugen\.nl$/i.test(locationObj.hostname || ''));
}

export function activateLegacyTab(doc, pageId) {
  const page = findPage(pageId);
  if (!doc || !page?.legacyTab) return false;
  const button = doc.querySelector(`[data-p="${page.legacyTab}"]`);
  if (!button) return false;
  button.click();
  return true;
}

export function openLegacyPage(pageId, { frame=null, fallbackOpen=globalThis.open, search=globalThis.location?.search || '' }={}) {
  const page = findPage(pageId);
  if (!page) return false;
  const url = buildLegacyUrl(pageId, customerSlug(search));
  if (!url) return false;

  if (frame && canEmbedLegacy()) {
    frame.src = url;
    frame.dataset.requestedPage = pageId;
    return true;
  }
  if (typeof fallbackOpen === 'function') fallbackOpen(url, '_blank', 'noopener');
  return true;
}
