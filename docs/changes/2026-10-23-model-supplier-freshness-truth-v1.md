# AI-modelwijzer — expliciete verouderde leveranciersverificatie (2026-10-23)

Obligation-ID: model-supplier-freshness-truth-20261023-v1

## Geconstateerd
Supabase heeft 110 supplier-records: 83 `VERIFIED`, 26 `PARTIAL`, 1 `CONFLICT`. Alle 110 bewaarde catalogus-verificatiedatums zijn ouder dan zeven dagen. Een recente wijziging van een databaserij is geen vernieuwing van een officiële leverancierverklaring. Voorheen gebruikte de modelwijzer/audit een grens van 14 dagen, waardoor een historical claim nog als actueel kon ogen.

## Correctie
De bestaande, officiële-bronnen-eerst route blijft de enige autoriteit. De catalogus, de zes vereiste individuele leverancierclaims, klantautorisatie en volledige zes-dimensiecontrole blijven ongemoeid. De dagelijkse audit, site-advisor en configuratie hanteren nu een grens van zeven dagen. De site toont expliciet `leverancierscontrole verouderd` bij niet-actuele bewijzen en sluit automatische aanbevelingen uit, in plaats van een `VERIFIED` label ten onrechte als actuele provider-waarheid te gebruiken.

## Bewijsgrenzen en kwaliteit
- Geen `verified_at` waarden of `claim_evidence` herschreven: geen valse bronvernieuwing.
- Geen nieuwe agent, cron, queue, modelcatalogus of automatische providerwissel.
- Canonieke regressietest: `tests/brain-ai-model-supplier-freshness-guard-v1.test.mjs`.
- Historische compatibiliteitstest: `tests/ai-model-intelligence-freshness-v1.test.mjs`.
- Audit: `scripts/brain/ai-model-intelligence-audit.mjs` hoort op deze dataset `REFRESH_REQUIRED` te rapporteren. Dit is gewenste transparantie, niet een bouwfout die groen geforceerd mag worden.
- Productiestatus: `PENDING_PROTECTED_MERGE_AND_DEPLOY_READBACK`. Alleen een vereiste CI-passage, protected merge en same-origin Netlify productiereadback kan 'live' onderbouwen.

## Preventie
Laat de bestaande dagelijkse self-evolution workflow de supplier freshness audit draaien. Nieuwe modelspecifieke leverancierbewijzen krijgen pas een nieuwe controledatum na onafhankelijke, verifieerbare actualiteitscontrole. Tenant governance blijft privé en afgeschermd.
