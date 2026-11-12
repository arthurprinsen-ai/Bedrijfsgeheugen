# Trusted Advisor canonical site shell — klantwaarheid boven onbegrensde belofte (2026-11-12)

**Original owner:** existing website/site-shell/CMS and ONE BRAIN issue #5284, no second writer, agent, scheduler or release path.
**Related verified production baseline:** PR #5678 merged at `6f0497afb07051cf06f62f38efdea59cf7507bf2` and Netlify production deploy `6af6201a2077ebe5d94f7d20` READY with exact SHA.
**Trust issue:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5284

## Reproduced live defect
After the first protected delivery, `https://www.bedrijfsgeheugen.nl/contact` and `https://www.bedrijfsgeheugen.nl/frisse-blik` still displayed `In twee weken draaiend` and `Vaste prijs, geen uurtje-factuurtje` in the global upper banner. The revised anonymous scan copy below that banner was correct. The `/zelfscan` page showed the newer careful headline. This is direct independent HTTP-readback using Zenrows after exact Netlify deployment, not a theoretical code-only defect.

## Root cause and repair in original owner
The original `tools/site-shell/apply-shell.mjs` projects global chrome from `over-ons.html`, while the fallback `tools/site-shell/components.mjs` trustbar and the exact `tools/controleer-site-ui.mjs` verifier enforced the old marketing claims. Thus editing individual page HTML alone could never persist through the standard build.

The single canonical correction:
- `over-ons.html` bgtop: **Duidelijke afspraken vooraf** / **Klein beginnen, resultaat toetsen**
- original `TRUST_BAR_HTML`: same two claims and unchanged Netherlands audience
- existing site-wide UI verifier: expects the same customer-first claims on final rendered pages
- existing `assets/js/i18n.js`: English translations of the new labels
- original trustbar regressions: deterministic evidence that canonical source, generator, verifier and EN mapping agree

No blanket implementation timeframe or unqualified price mechanism is presented as a universal fact. Product-specific prices, scope and delivery conditions remain on the appropriate offer pages.

## Release and one-chain acceptance
Run the unchanged original normalizer (`normaliseerAllePaginas`) and brand shell integrity gate on the complete public NL/EN + blog corpus; check rendered all-pages trustbar, no stale legacy bgtop, mobile menu, accessible CTA and exact content vs original source. Deploy only via Required/BRAIN/CodeQL protected merge and canonical Netlify. Then independently fetch actual `/contact`, `/frisse-blik`, `/zelfscan`, main page and public blog paths and verify no unqualified banner. Store provider deploy receipt and exact SHA against original issue #5284 and existing ONE BRAIN fingerprint. Any missing runtime consumer processed ACK or measured conversion uplift remains unverified.

**Current status: CODE CANDIDATE — live customer trust not proven.**
