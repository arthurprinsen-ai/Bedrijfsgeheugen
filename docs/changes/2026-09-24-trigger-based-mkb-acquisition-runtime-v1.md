# Trigger-based MKB acquisition runtime projection v1

Fingerprint: `powerhouse-trigger-based-mkb-acquisition-runtime-v1`
Datum: 2026-09-24

## Doel
Projecteer de reeds canonieke trigger-based acquisitieregel in de bestaande opportunity-runtime, zonder nieuwe CRM-store of parallelle commerciële authority.

## Runtime
`scripts/opportunity/opportunity-scout.mjs` exposeert nu `commercialContext()` en projecteert voor `commercial_acquisition=true`:
- trigger_type
- problem_hypothesis
- economic_impact_hypothesis
- decision_maker_role
- buyer_stage
- recommended_next_action
- recommended_content_angle
- partner_route
- observed_at
- evidence_refs
- commercial_ready
- commercial_execution_class
- do_not_contact_reason

## Fail-closed
`commercial_execution_class=trigger-led-next-action` ontstaat alleen wanneer:
- trigger_type aanwezig is;
- problem_hypothesis aanwezig is;
- decision_maker_role aanwezig is;
- recommended_next_action aanwezig is;
- minimaal één evidence_ref aanwezig is;
- confidence >= 0.6.

Anders blijft de opportunity op `observe` en wordt de ontbrekende context vastgelegd in `do_not_contact_reason`.

## Niet doen
Geen beslisser, trigger, partnerroute of volgende actie afleiden wanneer de input die niet expliciet bevat. Geen bulk outreach als fallback.

## Compatibiliteit
De bestaande opportunity-score, security-prioriteit en generieke qualification blijven behouden. De commerciële projectie is optioneel en wordt alleen geactiveerd door `commercial_acquisition=true`.
