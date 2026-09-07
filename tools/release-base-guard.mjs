export function evaluateReleaseBase({ testedBaseSha, currentMainSha, headSha } = {}) {
  const tested = String(testedBaseSha || '').trim();
  const current = String(currentMainSha || '').trim();
  const head = String(headSha || '').trim();

  if (!tested || !current || !head) {
    return Object.freeze({
      ok: false,
      reason: 'missing-release-evidence',
      testedBaseSha: tested,
      currentMainSha: current,
      headSha: head,
    });
  }

  if (tested !== current) {
    return Object.freeze({
      ok: false,
      reason: 'stale-main-base',
      testedBaseSha: tested,
      currentMainSha: current,
      headSha: head,
    });
  }

  return Object.freeze({
    ok: true,
    reason: 'current-main-base',
    testedBaseSha: tested,
    currentMainSha: current,
    headSha: head,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = evaluateReleaseBase({
    testedBaseSha: process.env.TESTED_BASE_SHA,
    currentMainSha: process.env.CURRENT_MAIN_SHA,
    headSha: process.env.HEAD_SHA,
  });
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
