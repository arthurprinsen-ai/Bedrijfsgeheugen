# portal-csrd-impact-release-brain-readback-v1

Datum: 2026-09-08
Status: PROVEN
Domein: Portal V2 / release / BRAIN delivery / production readback

## Samenvatting
Deze learning bundelt de live CSRD & Impact-release, de permanente Chromium-productiereadback en de structurele fix voor de post-merge moving-main race in BRAIN delivery.

## Releasebewijs
- CSRD & Impact is first-class native Portal V2, geen los demoportaal en geen tweede canonical route.
- Featuremerge: PR #1155, merge-SHA `4180f6b9532f4bb1ce4be1844b8bacac67163023`.
- Permanente productie-DOM-readback: PR #1174, merge-SHA `fb7bedcb898f16f7b41fb042eefa20c59f1f48de`.
- Actuele main-tip na parallelle merges: `f8fe72d61159086f78fb6c8b5f25869e0476594a`.
- Production Release Readback run `34220897596` is groen op exact die actuele main-SHA.
- Geslaagde readback-stappen: exact live release marker, connector readiness, production browser verifier, affected production routes en immutable production truth.

## BRAIN delivery race-condition
Symptoom: na merge vergeleek de handoff de feature-head opnieuw tegen een `currentMain` waarin dezelfde feature al was opgenomen. Daardoor werden de eigen featurebestanden foutief als moving-main overlap geclassificeerd.

Root cause: branch-drift kende geen terminale toestand voor een kandidaat-head die al ancestor van `currentMain` is.

Structurele fix: PR #1168, merge-SHA `c596a2235e5437f283d0d90246ee98bff515550b`.

Nieuwe classificatie: wanneer de kandidaat-head reeds in `currentMain` is geïntegreerd, retourneert de delivery-control-plane `head-already-integrated`. Er wordt dan geen successor rebuild of `SYNC_REQUIRED` gestart op basis van de eigen gemergde changeset.

## Preventieregels
1. Evidence before closure: geen `live`, `af`, `fixed` of `geborgd` zonder verse execution evidence op de actuele production identity.
2. Post-merge ancestry guard: vóór branch-drift altijd vaststellen of candidate/head al ancestor van `currentMain` is. Zo ja = terminale promoted-state, niet moving-main conflict.
3. Supersede is geen failure: een geannuleerde production-readback door `cancel-in-progress` is alleen acceptabel als er een opvolgende readback op de nieuwste main-SHA bestaat. De nieuwste niet-gesupersede run moet groen zijn.
4. DOM-readback is first-class: relevante Portal V2-releases krijgen browser-DOM-readback in CI. Noindex/search-indexering is geen excuus om alleen hosting/deploybewijs te accepteren.
5. Exact candidate identity: tests, merge, deploy/readback en learning blijven traceerbaar op exacte SHA's. Parallelle merges maken een eerdere release niet ongeldig zolang ancestry en production truth aantoonbaar zijn.
6. Geen gate-bypass: branch protection blijft beslissend; queued runners of moving-main druk zijn capaciteit/release-state, geen reden om required contexts handmatig groen te zetten.
7. Customer-safe compliance UI: voorbeelddata blijft expliciet `Voorbeelddata · geen live claim`; geen audit-ready/compliance/live-datalabel zonder echte bron, validation state, evidence en actuele assurance.

## Loop-contract
`signal -> reproduce -> root cause -> TDD guard -> protected CI -> merge -> production identity -> Chromium DOM readback -> immutable production truth -> learning/writeback -> next decision`

## Dedupe
Fingerprint / dedupe key: `portal-csrd-impact-release-brain-readback-v1`

## Rollback
Bij regressie in BRAIN ancestry-guard of production-readback: terug naar last-known-good delivery workflow. Branch protection nooit verlagen.

## Health signals
- Required test
- BRAIN delivery
- Portal V2 Production DOM Readback
- Production Release Readback
- current main SHA
- production marker

## Next decision
Alle toekomstige Portal V2 compliance/impact-modules erven deze release- en readbackregels. Alleen nieuwe afwijkende failure modes krijgen een nieuwe fingerprint.
