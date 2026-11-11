# Original portal production browser-failure learning (2026-11-11)

- Fingerprint: `portal|production-readback|demo-alias-double-navigation|20261111-v1`.
- Original owner: Portal V2 Production DOM Readback, same protected GitHub readback and existing Netlify production.
- Source run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43028996822
- Observation: Playwright mobile 24-capability test interrupted at `page.goto('/klantportaal?klant=demoAI...')` by expected `/portaal/demo` redirect. Other production release readback succeeded.
- Root cause: test used a legacy 301 public entry alias instead of its documented canonical demo route. This is a test bootstrap/navigation race, not a failure requiring new auth, data or a separate deployment executor.
- Resolution: use `/portaal/demo` directly for mobile parity, preserving all mobile widths, 24 protected capability assertions and existing routing checks.
- Evidence: protected Required/Portal/BRAIN/CodeQL, protected merge, exact-main original DOM readback success **still required**. No claim of new business outcome, award or verified two-tenant provider ACK.
