# Public website readback — navigation-race and no-response integrity

## Source of failure
PR #4229 merged and is provider-confirmed live on exact main `f40195ba9a0ade14733038ac5b143f364e1f462f`. Its production Portal V2 DOM browser readback `37892901902` succeeded. The **separate** public site canonical shell run `37892820886` ended in failure (3 cases): `/en/help` phone returned “Execution context was destroyed” between load and DOM evaluation; `/en/ai-automatisering-mkb` and `/en/ai-ecosysteem` on tablet had no browser navigation response after bounded retries.

## Mitigation
- Reattempt the same URL, using the existing bounded route/response verifier, only when navigation invalidates DOM evaluation. The reloaded page must still pass every header, main, H1, text, occlusion and CLS assertion.
- For a null `page.goto` response only, prove the browser is at the exact same-origin/same canonical route and independently obtain an HTTP-success response. Otherwise fail closed. A real 403/404 without independent success remains an error.
- Preserve full sitemap-derived and three-viewport coverage, existing concurrency limits, hard runtime budget and public/tenant access restrictions.
- `netlify.toml` carries only a bounded publication marker so immutable preview and exact-main production will be freshly built and verified; no runtime authorization or route changes.

## Evidence gates
Protected Required/CodeQL, exact-head Netlify preview, protected main merge, live release SHA and terminal public shell/Portal V2 DOM validation. Real customer A/B write→ONE BRAIN→impact/roadmap and official CSRD/ESRS applicability remain independent open items in parent #4215.
