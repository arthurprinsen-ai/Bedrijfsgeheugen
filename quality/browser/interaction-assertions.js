function overlapRatio(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  const overlap = width * height;
  const subjectArea = Math.max(1, a.width * a.height);
  return overlap / subjectArea;
}

async function assertVisibleAndReadable(locator, { minOpacity = 0.45 } = {}) {
  const evidence = await locator.evaluate(el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      display: style.display,
      visibility: style.visibility,
      opacity: Number(style.opacity || 1),
      width: rect.width,
      height: rect.height,
      clipped: el.scrollWidth > 0 && el.scrollHeight > 0 && rect.width === 0 && rect.height === 0,
    };
  });
  if (evidence.display === 'none' || evidence.visibility === 'hidden' || evidence.opacity < minOpacity || evidence.width <= 0 || evidence.height <= 0 || evidence.clipped) {
    const error = new Error(`content-hidden: element is not readable (${JSON.stringify(evidence)})`);
    error.failureClass = 'content-hidden';
    error.evidence = evidence;
    throw error;
  }
  return evidence;
}

async function assertNoForbiddenOverlap(subject, blocker, { maxOverlapRatio = 0.02 } = {}) {
  const [subjectBox, blockerBox] = await Promise.all([subject.boundingBox(), blocker.boundingBox()]);
  if (!subjectBox || !blockerBox) return { ratio: 0, subjectBox, blockerBox };
  const ratio = overlapRatio(subjectBox, blockerBox);
  if (ratio > maxOverlapRatio) {
    const error = new Error(`overlay-obstruction: overlap ratio ${ratio.toFixed(4)} > ${maxOverlapRatio}`);
    error.failureClass = 'overlay-obstruction';
    error.evidence = { ratio, subjectBox, blockerBox };
    throw error;
  }
  return { ratio, subjectBox, blockerBox };
}

async function assertStateChanged(page, readState, action, { failureClass = 'interaction-no-op' } = {}) {
  const before = await readState(page);
  await action();
  const after = await readState(page);
  if (after === before) {
    const error = new Error(`${failureClass}: state did not change from ${String(before)}`);
    error.failureClass = failureClass;
    error.evidence = { before, after };
    throw error;
  }
  return { before, after };
}

module.exports = { overlapRatio, assertVisibleAndReadable, assertNoForbiddenOverlap, assertStateChanged };
