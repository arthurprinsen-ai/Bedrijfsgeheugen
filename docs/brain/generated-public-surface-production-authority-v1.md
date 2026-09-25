# Generated public surfaces — Powerhouse production-authority contract

Datum: 25 september 2026  
Fingerprint: `website|generated-canonical-surface|post-build-projection|v1`

## Doel
Voorkomen dat een wijziging technisch correct in de repository staat maar tijdens de echte productiebuild weer verdwijnt.

## Canonieke regel
Bij iedere gegenereerde, herstelde, samengestelde of tijdens build herschreven publieke pagina wordt eerst vastgesteld welke stap de **production authority** is. Een los bronbestand is geen eindwaarheid wanneer een latere builder dat bestand opnieuw schrijft.

## Verplichte deliveryvolgorde
1. bepaal de production-authoritative builder/input;
2. plaats de wijziging daar of projecteer haar idempotent na het overwrite-punt;
3. voeg een regressie toe op de echte production builder;
4. valideer translation/cache-contracten voor nieuwe publieke copy;
5. lever via één canonieke candidate-lineage;
6. merge protected;
7. verifieer exact production identity;
8. lees de getroffen route functioneel terug;
9. schrijf outcome, learning en preventieregel terug naar Powerhouse.

## AI-ecosysteem implementatie
De AI-ecosysteempropositie gebruikt `tools/bouw-v18-ai-ecosysteem.mjs` als idempotente projectie en `tools/bouw-v18-production.mjs` als productie-wiring. De regression authority is `tests/brain-ai-ecosysteem-production-projection-v1.test.mjs`.

## Powerhouse-integratie
- machine policy: `brain/policies/powerhouse-agent-continuity-v1.json#generated_surface_projection_rule`;
- agent skill: `.agents/skills/powerhouse-continuity/SKILL.md`;
- canonical learning: `brain/learning/2026-09-25-ai-ecosysteem-production-projection-v1.json`;
- development ledger: `docs/development-ledger.md`;
- human system map / dashboard: Powerhouse Dashboard Hub en Canonical System Map blijven de projectielaag; repository/runtime evidence blijft authority.

Deze regel geldt voor huidige én toekomstige agents/chats en voor elke nieuwe generated website-surface.
