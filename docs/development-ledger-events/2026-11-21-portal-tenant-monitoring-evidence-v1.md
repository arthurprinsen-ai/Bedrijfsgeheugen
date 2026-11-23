# Ontwikkelingslogboek — originele Heartbeat tenant signal readback

- Datum: 21 november 2026
- Obligation-ID: portal-v2-tenant-signal-readback-20261121
- Delivery-Lane: portal
- Candidate-Type: implementation
- Owner: oorspronkelijke Portal / ONE BRAIN / Powerhouse / Heartbeat
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
- Status: SOURCE_CANDIDATE / RELEASE_AND_LIVE_TENANT_EVIDENCE_DUE

## Onafhankelijke uitgangssituatie

In EU Supabase draait scheduler #171 actief. Originele runtime-event `commercial_heartbeat` wordt telkens geregistreerd. `portal_state_layers` = 1 rij, 0 rijen met geconfigureerde `portal.signalering.rules`, 0 `portal_user_signal_observed`. Daardoor is een algemene Heartbeat niet bewijs van klant-specifieke regeldetectie.

## Gedane veranderingen

- Bestaande Heartbeat schrijft op zijn eigen bounded observation lane expliciet gescopeerde en gededupliceerde `portal_user_signal_scan`-ontvangstbewijzen, ook wanneer geen grens is overschreden. Het bronsverificatiestatusveld blijft UNKNOWN.
- Read-only tenantstatus in bestaande EU-servicegate; via Netlify Identity nieuwe read-only `/api/portal-signal-status`. Een vervalst browser-tenantId mag nooit klantgegevens van iemand anders tonen.
- Portal V2 laat bewijs en niet-bewezen vervolgacties zien; log-out en accountwissel wissen async bewijzen en spraakfocus. Er komt geen interval, push permission, externe mail-sender, of tweede business store.
- Bestaande breinregel (historisch/shadow/canary) en original skills houden de nieuwe grens tegen toekomstige regressie.

## Bewijs om af te sluiten

Exact protected PR CI en Netlify production commit, get-edge-function source matching, échte Identity-login, readback tenant A/B isolation, echte opt-in en natuurgetrouw periodiek scan-event plus onafhankelijke uitvoeringscontrole. Outbound email/push provider ID en autonome action outcome blijven OPEN tot onafhankelijk bevestigd. Geen dummyklantdata in productie injecteren om iets te bewijzen.
