# Portal V2 original production browser: evidence-only SHA replay for the original GitHub failure observer

## Independent producer and causal evidence
- Published Netlify production SHA `5f613a1802c9ece6d4023beef1c6a058caf9db22`, original deploy `6aeb29401ec7ec2b37b0ebd0` READY.
- Protected Portal mobile readback corrective PR #5417 merged as `e5006bc747d8e40441c1b2f14431c105d24a8a4a`. GitHub's original [Production DOM Readback #41841865840](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41841865840) started and passed its source-scope/visual-identity preflight, then waited for an exact SHA.
- Comparing published SHA to protected main gives **one** unmatched file in both original evidence-only whitelist checks: `tools/delivery/github-actions-failure-observer.mjs`. This original GitHub Actions observer is not a Portal V2 runtime asset and was introduced by a separate protected governance release. The original original browser target is the immutable published runtime, not arbitrary current main. Do not attempt to build a missing Netlify source revision solely to fix a test-only/observer evidence issue.

## Minimal scope-aware correction
The existing `.github/workflows/portal-v2-production-dom-readback.yml` has **two** independent explicit allowed-path checks for original published SHA replay. Permit exactly `tools/delivery/github-actions-failure-observer.mjs` in BOTH checks, not `tools/delivery/*` or `tools/**`. The original strict `git merge-base --is-ancestor`, real Netlify `release.json`, exact immutable deploy SHA equality, original approved PR and original Playwright end-to-end tests remain mandatory. Any changed customer runtime continues to block source-only fallback.

Extend original `tests/brain-original-portal-browser-readback-test-only-trigger-20261104.test.mjs` to fail if either allowlist omits the observer or contains a blanket delivery exception. This prevents the original incident from becoming a recurring 90-attempt silent wait.

## Honest closure
This is a **protected code candidate**. Required/CodeQL, protected merge, original producer readback, original browser 16-case DOM suite and actual 390px hydration must independently finish green. No security bypass, fabricated Netlify deployment, new browser runner, new scheduler or parallel GitHub writer. Human entrepreneur testing and authenticated customer task completion remain a separate UX evidence class.
