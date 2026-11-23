# 29 oktober 2026 — live bronstatus publicatieherstel in bestaande Portal V2

**Obligation:** `powerhouse|publication|blocked-channels-not-visible-in-portal|20261029`.

## Concrete bevinding

Op 29 oktober toont het echte Supabase-register `content_publication_obligations`: LinkedIn-bedrijf `LIVE_PROVEN` (provider-ID bewaard, dus nooit opnieuw publiceren); LinkedIn-persoonlijk `BLOCKED` door een eerdere story-family-duplicaatcontrole; Instagram `PLANNED` zonder bewezen provider-ID/asset; blog `GENERATED` zonder publieke browser-readback. Geen van deze staten mag zonder providerbewijs worden omgezet naar succes.

## Oplossing binnen bestaande Powerhouse

Voeg aan de bestaande admin-only `/api/powerhouse-observability` na Netlify Identity, admin en tenant-auth de **alleen-lezen** query toe op de bestaande `public.content_publication_obligations`, exact één canoniek tenant, de actuele publicatiedatum in `Europe/Amsterdam` en vier vaste kanalen. Provider `Content-Range` en identieke datum/tenant moeten volledig kloppen. Voor vier bewezen rijen worden uitsluitend status, of een provider-ID in het register staat, of intern livebewijs is geregistreerd en een veilige herstelcode naar het portaal gestuurd. Nooit ruwe fout, conceptblog, provider-ID, access key of klantgegevens naar de browser. Bij ontbrekende providerdata is de volledige kaart `UNVERIFIED`.

Veilige herstelcodes: LinkedIn-bedrijf verzamelen metrics maar **niet opnieuw verzenden**; LinkedIn-persoonlijk eerst een echt nieuwe bron/feit en distinct story, geen duplicaat omzeilen; Instagram eerst canonieke media- en identiteitscontrole en daarna provider; blog alleen via protected GitHub→Netlify→browser-readback. De kaart voert zelf geen writes uit, stuurt geen social media en maakt geen tweede agent/scheduler.

## Bewijs en nog openstaand

5/5 unit/contract regressietests + bestaande beveiligings- en System Map-testfamilies. De System Map-generator moet op elke exacte kandidaat via `--write` en `--check` bron/assetdrift bewaken. Protected Required/BRAIN/CodeQL, squash merge, Netlify productiedeploy en ingelogde tenant-/adminreadback zijn release-eisen.

**Wat deze wijziging niet oplost:** het daadwerkelijk aanmaken van nieuw media-asset, onafhankelijke OAuth/providertoegang, echte publicatie van de andere drie kanalen, ontbrekende agent-ID's/skill- en voor-/nametingen of gerealiseerde leads/orders. Die blijven onder dezelfde canonieke execution lineage en eerdere incidenten OPEN.
