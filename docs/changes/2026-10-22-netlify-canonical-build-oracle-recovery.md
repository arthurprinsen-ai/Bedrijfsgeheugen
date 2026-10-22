# BRAIN build-oracle recovery — 22 October 2026

Source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043 — 3,511 tests, 3,190 passed, 321 failed (historical baseline).

Root cause: six inherited test suites inspect retired long inlined build commands in \`netlify.toml\`. Production and deploy preview now use \`tools/ci/netlify-build-entry.mjs\`; this authoritative script dispatches ordered phases and throws on nonzero. Restoring old commands would be unsafe false-green.

Correction: tests inspect both canonical build commands and the actual phase list; validate ordered transforms, full phase script syntax, product-led homepage step and exact-candidate local browser fallback. No runtime, provider, scheduler, migration, tenant or security changes.

Acceptance: exact-head targeted Node, Required, CodeQL and fresh full BRAIN all required. This PR is **UNVERIFIED** until checks pass, and is not a claim that 321 failures became zero. Parent #3742 and customer-isolation #4215 remain independently open.

## Additional same-root coverage (22 October 2026)
The exact-head full BRAIN verification-only run #39764656116 proved 3,521 tests / 3,169 pass / 352 fail, including two additional retired inline Netlify build oracles in SEO sitemap and website coherence test suites. Both now read the same real canonical production/deploy-preview phases and assert transform order, sitemap/locale verification and terminal website coherence. No runtime/Netlify/workflow changes or skipped tests. Added both suites to canonical historical replay; until fresh exact-head gates pass the new coverage remains UNVERIFIED.

## Learning replay scope based on exact CI evidence
The first 8-file replay run #39765624372 surfaced two unrelated existing assertions in the website coherence suite: product hero visibility and route metadata. Both remain in full BRAIN. The changed website-coherence execution invariant is additionally asserted inside the existing dedicated Netlify production build parity suite (part of replay). Neither failure is suppressed from full BRAIN; never claim they passed or relax the all-zero merge gate. Focused replay now covers seven test files, while eight inherited files contain source-oracle repairs.
