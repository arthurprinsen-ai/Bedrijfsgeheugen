# 9 oktober 2026 — echte SalesRobot-DM's in commerciële dagwaarheid

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

Bestaande toestand: vijf werkelijk verzonden DM's hebben elk een provider-inbox-ID, een SalesRobot-observatie in `powerhouse_runtime_events`, en een `done`-actie in `powerhouse_sales_actions` met FK naar dezelfde observatie. Toch rapporteert `powerhouse_commercial_output_assurance_v1` social=0 omdat het alleen directe provider-velden op de actie leest en de geneste SalesRobot-inboxproof niet herkent.

Fix: dezelfde bestaande assurance-functie telt alleen een actie met provider-`SENT`, echte provider-inboxreadback, matching provider-message-ID/campagne en een exact geobserveerde runtime-event-FK; dubbele top-level providerbewijs-acties worden uitgesloten. Providerboodschappen komen in `provider_proof`; afzonderlijke teller `provider_proven_salesrobot_dm`; `provider_proven_social` stijgt op basis van feitelijke bewijzen.

Niet gewijzigd: eenmalige NETLIFY_SUPABASE_EDGE scheduler, CRM, SalesRobot-campagne, verzending, consent/approval, suppression/cooldown, content-publicatie, exacte provider-gates en de status van niet-bewezen antwoorden/offertes/omzet. Eén bewezen commerciële dag is niet gelijk aan volledige omnichannel-dekking.

Acceptatietests: expliciete 5/5 matched provider-IDs 2026-10-09; ontbrekende event-FK/receipt telt 0; bestaande blog telt 1; geen dubbel tellen als directe provider-object-proof al aanwezig is. Functionele live readback verplicht vóór sluiting van de fix. 
