# Eén canonieke commerciële closed loop

Datum: 5 oktober 2026  
Obligation: `one-commercial-closed-loop-v1`

PR #3737 canonicaliseert de commerciële Powerhouse-keten als één end-to-end loop:

`heartbeat → intelligence/read model → next-best-action → single materializer → research indien bewijs ontbreekt → message plan/composer/quality → provider dispatch → provider acknowledgment → terminal outcome → revenue attribution → learning → volgende beslissing`.

De latency-kritieke heartbeat voert geen zware enrichment-refresh meer inline uit. Die zware stappen blijven asynchroon; de heartbeat consumeert een begrensd, actueel read model. Daardoor kan één trage enrichment-stap de rest van de commerciële executie niet meer blokkeren.

Nieuwe `SECURITY DEFINER`-functies zijn fail-closed gemaakt: `PUBLIC`, `anon` en `authenticated` krijgen geen directe EXECUTE-rechten; vertrouwde serveruitvoering blijft expliciet bij `service_role`.

Delivery is onderdeel van dezelfde invariant. De PR is pas terminal groen na exact-head volledige checkset, security, merge, production deploy/readback en learning closure. Een reeds toegepaste productiedatabasewijziging telt niet als vervanging voor GitHub delivery-bewijs.

Daarnaast is de Supabase preview-capaciteit hersteld door de achtergebleven previewbranch van reeds gemergede PR #3280 te verwijderen. Open previewwerk, zoals PR #3307, blijft intact.
