export function evaluateReleaseBase({ testedBaseSha, currentMainSha, headSha, driftAction = '' } = {}) {
  const tested = String(testedBaseSha || '').trim();
  const current = String(currentMainSha || '').trim();
  const head = String(headSha || '').trim();
  const action = String(driftAction || '').trim();

  if (!tested || !current || !head) {
    return Object.freeze({ ok:false, reason:'missing-release-evidence', testedBaseSha:tested, currentMainSha:current, headSha:head, driftAction:action });
  }

  if (tested === current) {
    return Object.freeze({ ok:true, reason:'current-main-base', testedBaseSha:tested, currentMainSha:current, headSha:head, driftAction:action });
  }

  if (action === 'KEEP_TESTED_FEATURE') {
    return Object.freeze({ ok:true, reason:'main-moved-non-overlapping', testedBaseSha:tested, currentMainSha:current, headSha:head, driftAction:action });
  }

  return Object.freeze({ ok:false, reason:'stale-main-relevant-drift', testedBaseSha:tested, currentMainSha:current, headSha:head, driftAction:action || 'UNKNOWN' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = evaluateReleaseBase({
    testedBaseSha: process.env.TESTED_BASE_SHA,
    currentMainSha: process.env.CURRENT_MAIN_SHA,
    headSha: process.env.HEAD_SHA,
    driftAction: process.env.DRIFT_ACTION,
  });
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
