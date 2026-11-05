# 2026-11-05 — website browser core request canonical redirect false-red

- Original owner: existing Website Cross-Browser Screenshot Assurance; parent incident #4447; no second publisher, scheduler or release writer.
- Provider observation: original GitHub run #42075945749 (main 19b46d540a721bbab0b43cfd7f2dc914ee38e95c), mobile /blog/wat-is-een-bedrijfsgeheugen document ERR_CONNECTION_RESET; resulting report 271 routes, 640 results, 24 interactions, 1 failure; artifact 13439631334.
- Independent Netlify: 499 no-slash aborted request; subsequent redirect 301 and canonical slash 200. No observed 5xx in window. Exact path equality in original settlement filter caused false-red after successful same-page load.
- Fix: narrowly scoped pure recovery helper; source import; actual positive and negative contract regression. All strict final HTTP, canonical path, script/CSS, UX/CLS and browser screenshot gates retained.
- ONE BRAIN fingerprint: `ci|cross-browser|canonical-trailing-slash-transient-document-reset|20261105-v1`; real original occurrence already recorded, maturity OBSERVED pending proof.
- Required closure: protected admission and merge, original postmerge full browser replay and artifact with failures=0, explicit independent readback; update original incident without claiming backup deploy was exercised.
