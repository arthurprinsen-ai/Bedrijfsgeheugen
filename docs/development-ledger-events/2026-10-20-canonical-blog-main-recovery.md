# Ledger — 2026-10-20 canonical blog recovery

Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: content-publication:2026-10-20:blog
Delivery-Lane: website
Candidate-Type: recovery
Base-SHA: af049994ba509d8e0bd9d27eea82f4245c5bc0a9
Original-Candidate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4518
Status: SOURCE_CANDIDATE / NOT_LIVE

Proven source: productietabel powerhouse_content_artifacts bevat één 2026-10-20 blog-artifact in `content_ready`, met ~992 woorden, datumgebonden titel, CTA en inhoud. Stale PR #4518 voegt een bestaande HTML-pagina plus EN-vertalingen, RSS, index en sitemap toe maar loopt 35 commits achter. De huidige opvolgbranch neemt dezelfde canonieke inhoud over en past de lopende `main` alleen additief aan.

Quality/assurance: dedicated unique URL/RSS/sitemap bilingual contract test; require Required CI, CodeQL, deploy preview and final protected merge. Do not add second article for this day or mark live based on merge alone. Production verify exact SHA and public permalink; then provider-proof evidence and reconcile the canonical obligation. No forced merge or customer identity exposure.
