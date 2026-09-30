# Development ledger — product-led production promotion

- Date: 2026-09-30
- Obligation: `powerhouse-product-led-home-production-20260930`
- Symptom: protected main bevatte de product-led homepage, terwijl Netlify production nog commit `f65f5d3…` serveerde.
- Action: bounded Netlify redeploy heartbeat in `netlify.toml` om een verse production build te forceren.
- Verification contract: Netlify production commit_ref moet de merged product-led lineage bevatten en de publieke homepage moet Intelligence, Agents en Connect tonen.
- Prevention: repository truth en production truth worden niet meer als gelijk behandeld zonder provider- en browser-readback.
- CI coverage: `tests/product-led-home-v1.test.mjs` is now wired into the canonical Required test workflow.
- Confirmed root cause: `apply-product-led-home.mjs` referenced retired `prototype-v18-stable.html`; canonical premerge parity omitted the product-led step and therefore missed the Netlify failure.
- Fix: target only `index.html`, use full canonical URLs, and execute the product-led step in Required test premerge build parity.
- Delivery refresh: final seven-path promotion scope published before terminal CI.
- Final candidate refresh: canonical Brain regression path is now classified and included in the seven-path scope.
