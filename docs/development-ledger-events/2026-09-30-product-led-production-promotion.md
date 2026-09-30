# Development ledger — product-led production promotion

- Date: 2026-09-30
- Obligation: `powerhouse-product-led-home-production-20260930`
- Symptom: protected main bevatte de product-led homepage, terwijl Netlify production nog commit `f65f5d3…` serveerde.
- Action: bounded Netlify redeploy heartbeat in `netlify.toml` om een verse production build te forceren.
- Verification contract: Netlify production commit_ref moet de merged product-led lineage bevatten en de publieke homepage moet Intelligence, Agents en Connect tonen.
- Prevention: repository truth en production truth worden niet meer als gelijk behandeld zonder provider- en browser-readback.
