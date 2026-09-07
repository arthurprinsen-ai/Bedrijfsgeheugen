function normalizeLanes(values = []) {
  return [...new Set((values || []).map(value => String(value).trim()).filter(Boolean))];
}

export function evaluateReleaseBase({ testedBaseSha, currentMainSha, headSha, prLanes = [], mainChangedLanes = [] } = {}) {
  const tested = String(testedBaseSha || '').trim();
  const current = String(currentMainSha || '').trim();
  const head = String(headSha || '').trim();
  const pr = normalizeLanes(prLanes);
  const main = normalizeLanes(mainChangedLanes);

  if (!tested || !current || !head) {
    return Object.freeze({ ok:false, reason:'missing-release-evidence', testedBaseSha:tested, currentMainSha:current, headSha:head, prLanes:pr, mainChangedLanes:main });
  }

  if (tested === current) {
    return Object.freeze({ ok:true, reason:'current-main-base', testedBaseSha:tested, currentMainSha:current, headSha:head, prLanes:pr, mainChangedLanes:main });
  }

  const overlap = pr.filter(lane => main.includes(lane));
  if (pr.length > 0 && overlap.length === 0) {
    return Object.freeze({ ok:true, reason:'main-moved-disjoint-lanes', testedBaseSha:tested, currentMainSha:current, headSha:head, prLanes:pr, mainChangedLanes:main });
  }

  return Object.freeze({ ok:false, reason:'stale-main-overlapping-lane', testedBaseSha:tested, currentMainSha:current, headSha:head, prLanes:pr, mainChangedLanes:main, overlappingLanes:overlap });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = evaluateReleaseBase({
    testedBaseSha: process.env.TESTED_BASE_SHA,
    currentMainSha: process.env.CURRENT_MAIN_SHA,
    headSha: process.env.HEAD_SHA,
    prLanes: JSON.parse(process.env.PR_LANES_JSON || '[]'),
    mainChangedLanes: JSON.parse(process.env.MAIN_CHANGED_LANES_JSON || '[]'),
  });
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
