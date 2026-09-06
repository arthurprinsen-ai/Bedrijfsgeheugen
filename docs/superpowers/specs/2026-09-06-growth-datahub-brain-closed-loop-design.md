# Growth DataHub Brain Closed Loop Design

## Doel
Bedrijfsgeheugen optimaliseert websitebeslissingen op gekwalificeerde leads, gewonnen orders en omzet. Rankings, CTR en engagement zijn tussensignalen. Website-events moeten duurzaam in de Europese DataHub landen, ook als Make/Powerhouse tijdelijk gepauzeerd is, en daarna dedupebaar via BG211 naar Brain/lineage/learning kunnen worden gereplayed.

## Architectuur
1. Browser -> `/api/growth-event` voor privacy-arme gedrags- en conversie-events.
2. Netlify valideert, dedupet en bewaart eerst in Blobs als lokale fail-safe queue.
3. Netlify schrijft hetzelfde genormaliseerde event server-to-server naar Supabase DataHub in eu-central-1 via een token-authenticated Edge Function.
4. Als `BG211_DELIVERY_ENABLED=true`, levert Netlify best-effort door aan BG212 -> BG211. Make-falen verandert de website-respons niet in een fout en veroorzaakt geen retry storm.
5. Interne commerciële systemen kunnen `/api/growth-outcome` gebruiken voor `lead`, `qualified_lead`, `appointment`, `proposal`, `won_order` en `revenue`. Dit endpoint vereist de bestaande Bedrijfsgeheugen service-token en is niet bedoeld voor browsergebruik.
6. DataHub koppelt outcome aan `attribution_root_key`, canonical landingpage, intent-owner en eventueel campaign/source; er wordt geen formulierinhoud of vrije PII in de growth-tabellen opgeslagen.
7. BG211 blijft de canonieke Powerhouse-ingang. Wanneer Make gepauzeerd is, blijft een deferred writeback obligation open; zodra runtime terug is mag een bounded replay maximaal één keer per event/fingerprint plaatsvinden.

## DataHub-model
- `growth_events`: immutable/deduped website/search/conversion observations.
- `growth_outcomes`: commerciële outcomes en waarde, gekoppeld aan attribution root.
- `growth_page_daily`: read model per dag/canonical/intent met sessions/events/CTA/leads/orders/revenue.
- `growth_brain_queue`: status van Brain-delivery zodat DataHub ook de replay-verplichting kent.

Alle tabellen zijn server-only: RLS aan, geen anon/authenticated grants. Alleen service-role via Edge Function.

## Money score
Optimalisatieprioriteit volgt businesswaarde, niet traffic alleen:
`score = search_visibility * ctr_quality * engagement_quality * cta_quality * lead_quality * order_quality * revenue_weight`.
Geen autonome contentclaim mag worden verzonnen. Toegestane bounded acties blijven titel/meta/CTA/interne links/support-topic/content-gap/evidence-gap/cannibalization cleanup onder bestaande releasegates.

## Fail-closed / fail-safe
- Onbekende payloadvelden met mogelijke PII/secrets worden geweigerd of verwijderd vóór DataHub.
- Website blijft werken als DataHub/Make niet beschikbaar is.
- Geen Make-retries zolang organisatie/team quota-paused is.
- Geen claim `learned` zonder BG211/BG168/BG166 execution + readback evidence.
- Revenue/outcome-events komen alleen via authenticated server-side endpoint.

## Productieregel
Een release is pas groen na tests, Supabase schema-readback, Edge Function canary, Netlify exact-SHA deploy en live endpoint readback. Make/Brain-runtime blijft expliciet `blocked` zolang Make meldt dat organization/team paused is.