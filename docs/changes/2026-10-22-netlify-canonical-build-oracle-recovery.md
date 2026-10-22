# BRAIN build-oracle recovery — 22 October 2026

Source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043 — 3,511 tests, 3,190 passed, 321 failed (historical baseline).

Root cause: six inherited test suites inspect retired long inlined build commands in \`netlify.toml\`. Production and deploy preview now use \`tools/ci/netlify-build-entry.mjs\`; this authoritative script dispatches ordered phases and throws on nonzero. Restoring old commands would be unsafe false-green.

Correction: tests inspect both canonical build commands and the actual phase list; validate ordered transforms, full phase script syntax, product-led homepage step and exact-candidate local browser fallback. No runtime, provider, scheduler, migration, tenant or security changes.

Acceptance: exact-head targeted Node, Required, CodeQL and fresh full BRAIN all required. This PR is **UNVERIFIED** until checks pass, and is not a claim that 321 failures became zero. Parent #3742 and customer-isolation #4215 remain independently open.
