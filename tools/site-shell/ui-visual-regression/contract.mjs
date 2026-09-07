import { readFile } from 'node:fs/promises';

export async function loadVisualRegressionRegistry(path = 'config/ui-visual-regression.json') {
  return JSON.parse(await readFile(path, 'utf8'));
}

export function validateVisualRegressionRegistry(registry) {
  const errors = [];
  if (!registry || registry.version !== 'UI-VISUAL-REGRESSION-v1') errors.push('invalid version');
  const pages = Array.isArray(registry?.pages) ? registry.pages : [];
  const seen = new Set();
  for (const page of pages) {
    if (!page?.route || seen.has(page.route)) errors.push(`duplicate or missing route: ${page?.route ?? '<missing>'}`);
    seen.add(page?.route);
    if (!Array.isArray(page?.required) || page.required.length === 0 || page.required.some(x => typeof x !== 'string' || !x.trim())) errors.push(`route ${page?.route}: required anchors must be non-empty selectors`);
    if ('exempt' in (page || {})) errors.push(`route ${page?.route}: blanket exemptions are forbidden`);
    for (const pair of page?.protectedPairs || []) {
      if (!pair?.a || !pair?.b) errors.push(`route ${page?.route}: protected pair selectors required`);
    }
    for (const exemption of page?.exemptions || []) {
      for (const key of ['selectorA','selectorB','reason','owner','maxIntersectionAreaPx2','reviewAfter']) {
        if (!(key in exemption)) errors.push(`route ${page?.route}: exemption missing ${key}`);
      }
      if (exemption.reviewAfter && Number.isNaN(Date.parse(exemption.reviewAfter))) errors.push(`route ${page?.route}: exemption reviewAfter must be ISO date`);
    }
    for (const action of page?.interactions || []) {
      if (!['click','drag-x-percent'].includes(action?.type)) errors.push(`route ${page?.route}: unsupported interaction ${action?.type}`);
      if (!action?.selector) errors.push(`route ${page?.route}: interaction selector required`);
      if (action?.type === 'drag-x-percent' && ![25,50,75].includes(action?.percent)) errors.push(`route ${page?.route}: drag percent must be 25, 50 or 75`);
    }
  }
  for (const viewport of registry?.defaults?.viewports || []) {
    if (!Number.isFinite(viewport.width) || !Number.isFinite(viewport.height) || viewport.width <= 0 || viewport.height <= 0) errors.push(`invalid viewport ${viewport?.name ?? '<unnamed>'}`);
  }
  return errors;
}

export function validateProtectedPageCoverage(registry, routes) {
  const registered = new Set((registry?.pages || []).map(x => x.route));
  return routes.filter(route => !registered.has(route)).map(route => `missing protected route: ${route}`);
}

export function scanDangerousLayoutPatterns(html, pageContract = {}) {
  const violations = [];
  for (const pair of pageContract.protectedPairs || []) {
    const hasAbsolute = /position\s*:\s*absolute/i.test(html);
    const hasTransform = /transform\s*:/i.test(html);
    const hasBoundedGrid = /display\s*:\s*(grid|flex)/i.test(html);
    if (hasAbsolute && hasTransform && !hasBoundedGrid) {
      violations.push({ ruleId: 'dangerous-unbounded-positioning', selectorPair: [pair.a, pair.b] });
    }
  }
  return violations;
}
