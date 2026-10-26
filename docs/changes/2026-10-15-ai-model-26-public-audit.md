# Leverancierscontrole van de 26 resterende AI-modelcatalogusrecords

**Datum:** 15 oktober 2026  
**Doel:** bestaande AI-modellen van derden documenteren met herleidbare leveranciersbronnen, zonder onbewezen claims goed te keuren.

## Resultaat

De Supabase-database bevat 110 records. Voor 26 bestaande `PARTIAL` records is nu een nieuw broncontroleverslag opgeslagen. De indeling blijft **83 VERIFIED / 26 PARTIAL / 1 CONFLICT**. De afzonderlijke `CONFLICT` is `amazon-nova-premier`; de gepubliceerde AWS-datums zijn tegenstrijdig en vragen om geautoriseerde account-/regiocontrole.

Voor de 26 records is in `supplier_audit.public_26_model_review_20261015` vastgelegd:
- primaire leverancier-URL en onderscheid tussen een specifieke modelkaart, modellenindex, levenscycluslijst en prijstabel;
- publiek aantoonbare waarneming versus ontbrekende claims, met correcte historische status (waar toepasselijk);
- expliciete `supplier_full_approval=false`, `release_eligible=false`, ontbrekende klantcontract-/runtimebevestigingen en `automatic_recommendation_eligible=false`;
- de volgende verifieerbare handeling.

Een aparte tariefregistratie in vijf records bewaart de **juiste prijseenheid**, niet een geschatte klantfactuur:
- DeepSeek Flash en DeepSeek V4 Pro: piek- en daltarieven per miljoen API-tokens, inclusief cache-hit/miss;
- Cohere Command A+, Embed 4, Rerank 4 Pro: Model Vault tarieven per instantie-uur, niet automatisch de pay-as-you-go API-prijs.

## Herkomst en noodzakelijke grenzen

**Amazon (12):** de officiële Bedrock-modelkaarten en regionale legacy/EOL-lijst, plus prijzen en dataretentie. Account-/regio-afhankelijke modelbeschikbaarheid, effectieve retentie en definitieve kostprijs zijn niet bewezen. https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html ; https://aws.amazon.com/bedrock/pricing/ ; https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html

**Cohere (4):** modellen en Model Vault-tarieven. Prijzen van dedicated instanties mogen niet worden gelijkgesteld aan de publieke API-tarieven of onderhandelde contracten. https://docs.cohere.com/docs/model-vault/standard/pricing ; https://docs.cohere.com/docs/cohere-embed

**DeepSeek (2):** de officiële prijstabel bevestigt modelidentiteiten en API-tarieven, maar de servicevoorwaarden vormen geen klantspecifieke verklaring voor ZDR, Europese verwerking of DPA. https://api-docs.deepseek.com/quick_start/pricing/ ; https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html

**Google (2):** Gemini 3.5 Flash en 3.7 Flash zijn verouderde aliassen die automatisch worden doorgestuurd naar respectievelijk 3.6 Flash en 3.8 Flash. Oude aliasprijzen mogen niet als actuele facturatie worden gepresenteerd. https://ai.google.dev/gemini-api/docs/changelog

**Falcon/TII (6):** officiële modelrepositories documenteren downloadbare modelgewichten en Falcon-LLM-licentievermeldingen; deze zijn geen bewijs van hostingkosten of rechten voor de beoogde commerciële implementatie. https://huggingface.co/tiiuae/Falcon-H1-7B-Instruct

## Acceptatie

Dit is een afgeronde **controle van openbare leveranciersbronnen**, niet een volledige leverancier-, account- of klantgoedkeuring. De bestaande fail-closed catalogustests en tenantgovernance-eisen blijven gelden. Alle beschermde CI-tests, merge en afzonderlijke productie-readback van exact de gewijzigde catalogus zijn verplicht.

Zie ook het bewijs in https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4374#issuecomment-6188229998 .
