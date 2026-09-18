# Powerhouse terminal delivery consolidation — 18 september 2026

Fingerprint: `powerhouse-terminal-delivery-consolidation-2026-09-18-v1`

## Bewezen huidige toestand

- GitHub `main` en Netlify productie wijzen naar dezelfde commit: `8a9aa1c3488c9289a9510fbad6b7cad3e078f932`.
- One Brain: 32/32 lagen wired, 18/18 vereiste jobs actief, 0 structurele lineage-gaps en 0 ongezonde vereiste evidence-bronnen.
- CI-fan-out is structureel teruggebracht: 226 queued / 18 in progress vóór single-flight; 9 queued / 3 in progress bij productie-readback.
- Portal V2 legacy parity is protected gemerged via #1851 met productie-readback recovery #2038; DOM-readback is groen.
- Fast Development v2 is protected gemerged via #2026 en actief in mandatory chat/agent preflight, met Universal Ingress fail-closed behouden.
- Delivery hygiene kan via #2039 een expliciet gesupersede gesloten/merged predecessor ophalen en dezelfde obligation-id valideren.
- Structural gap closure via #2023 materialiseert historische sales-acties evidence-first; geen latere cycle stages worden gesynthetiseerd.
- Readiness onderscheidt toekomstige calibraties van overdue debt en ongeconfigureerde klantconnectors van connectorfouten.
- Browserrollen hebben geen directe tabelrechten meer op media-proof evidence; service role blijft authority.

## Eerlijke resterende incidentstate

Instagram 18-09-2026 blijft `BLOCKED / EXACT_FINAL_MEDIA_PROOF_REQUIRED`. De provider heeft al verzonden, maar vision-readback bewees dat de gebruikte fallback een text-only Mira-kaart was. Het record blijft fail-closed en `republish_forbidden=true`; er wordt niet dubbel gepubliceerd en het bewijs wordt niet groen gemaakt. De preventieve vision-only gate is inmiddels actief in review/orchestrator/publisher.

## Permanente regels

1. Oude queued/pending runs zijn nonterminal; nieuwe heads superseden oude uitvoeringspogingen.
2. Heavy PR workflows gebruiken PR-single-flight; stale heads mogen geen runner-capaciteit blijven opeten.
3. Recovery van een merged voorganger blijft dezelfde obligation en moet expliciet via `Supersedes` verifieerbaar zijn.
4. Historische acties mogen alleen naar de vroegste aantoonbare cyclusfase worden gematerialiseerd; analysis/prediction/decision/execution/outcome vereisen eigen evidence.
5. Demo/test identity telt niet als productieklant-debt.
6. Future-due calibraties zijn geen overdue failure.
7. Production readback-tests volgen canonieke productlabels en state-contracten; stale oracles worden hersteld zonder het product terug te draaien.
8. Terminal succes vereist current-main identity, protected merge, exacte productie/provider identity, functionele readback en learning writeback.
9. Een al verzonden maar ongeldig bewezen social asset wordt niet opnieuw gepubliceerd om een healthstatus groen te maken.
10. Skills en learning-records worden bijgewerkt op basis van actuele productie-evidence, niet chatgeheugen.


## Reused historical fingerprints

- `delivery-classifier-repository-writer-contract-gap-v1` → `CLASSIFIER_COCHANGE_REQUIRED`.
- `github-required-gate-in-progress-nonterminal-v1` → queued, pending and in-progress gates are nonterminal execution states; unavailable live logs during active jobs are observability timing, not a product failure.
- `delivery-failure|capacity|shared|github-actions-queued-not-platform-outage` → classify runner scheduling and repository fan-out before claiming an external platform outage; do not retrigger while the exact-head queue is draining.
- Squash completion uses deterministic merged-PR identity fallback and fails closed on ambiguity.
- Post-merge reconciliation/cleanup failures must leave durable evidence and an operator-visible error.
