export function intersectionArea(a, b) {
  const aw = Math.max(0, Number(a?.width) || 0);
  const ah = Math.max(0, Number(a?.height) || 0);
  const bw = Math.max(0, Number(b?.width) || 0);
  const bh = Math.max(0, Number(b?.height) || 0);
  const ax2 = (Number(a?.x) || 0) + aw;
  const ay2 = (Number(a?.y) || 0) + ah;
  const bx2 = (Number(b?.x) || 0) + bw;
  const by2 = (Number(b?.y) || 0) + bh;
  const w = Math.max(0, Math.min(ax2, bx2) - Math.max(Number(a?.x) || 0, Number(b?.x) || 0));
  const h = Math.max(0, Math.min(ay2, by2) - Math.max(Number(a?.y) || 0, Number(b?.y) || 0));
  return w * h;
}

export function visibleRatio(rect, viewport) {
  const width = Math.max(0, Number(rect?.width) || 0);
  const height = Math.max(0, Number(rect?.height) || 0);
  const area = width * height;
  if (!area) return 0;
  const viewportRect = { x: 0, y: 0, width: viewport.width, height: viewport.height };
  return Math.max(0, Math.min(1, intersectionArea(rect, viewportRect) / area));
}

export function evaluateHorizontalOverflow({ scrollWidth, clientWidth }, maxPx = 1) {
  const overflow = Math.max(0, Number(scrollWidth) - Number(clientWidth));
  return overflow > maxPx ? [{ ruleId: 'horizontal-overflow', actual: overflow, limit: maxPx }] : [];
}

export function evaluateGeometry(sample, thresholds = {}) {
  const visibleRatioMin = thresholds.visibleRatioMin ?? 0.98;
  const violations = [];
  for (const item of sample.required || []) {
    if (!item.present) {
      violations.push({ ruleId: 'missing-required', selector: item.selector });
      continue;
    }
    if (item.display === 'none' || item.visibility === 'hidden' || Number(item.opacity) === 0) {
      violations.push({ ruleId: 'hidden-required', selector: item.selector });
      continue;
    }
    const ratio = visibleRatio(item.rect, sample.viewport);
    if (ratio < visibleRatioMin) violations.push({ ruleId: 'visible-ratio', selector: item.selector, actual: ratio, limit: visibleRatioMin });
  }
  for (const pair of sample.pairs || []) {
    if (!pair.aPresent || !pair.bPresent) {
      violations.push({ ruleId: 'missing-protected-pair', selectorPair: [pair.aSelector, pair.bSelector] });
      continue;
    }
    const area = intersectionArea(pair.a, pair.b);
    const allowance = pair.allowance ?? thresholds.overlapMaxAreaPx2 ?? 0;
    if (area > allowance) violations.push({ ruleId: 'overlap', selectorPair: [pair.aSelector, pair.bSelector], actual: area, limit: allowance });
  }
  violations.push(...evaluateHorizontalOverflow(sample.document || {}, thresholds.horizontalOverflowMaxPx ?? 1));
  return violations;
}
