# Bedrijfslek ONE BRAIN — productie-configuratie sluitend maken

- Parent P0 #4198, follow-up op merged PR #4286.
- Concrete fout: de workflow 'Supabase Edge Production Authority' stopte op `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:powerhouse-scan-ingest` na merge `eccf6bac75d53cc11c9d792356e756843932d994`.
- Supabase productie-bron is echter al ACTIVE versie 12 met `bedrijfslek_scan`, en de bestaande runtime cycle-trigger accepteert `website.bedrijfslek`. Dit is een *source-authority drift*, niet een reden voor een nieuwe functie of scheduler.
- Het herstel voegt precies één bestaande functie toe aan `supabase/config.toml`, met exact hetzelfde `verify_jwt=false` als live, omdat de functie zelf de `x-bg-service-token` met SHA-256 vergelijkt en privileged history/claim alleen via de geauthenticeerde Netlify proxy bereikbaar is.
- Browserclients zien géén service-token en kunnen geen tenant claimen via de publieke scan-ingest.
- Een test bewijst declaratie, uniek pad, bronidentiteit en de bestaande auth-poorten.
- Sluiting vergt beschermde merge, Supabase provider-source-readback en schone postmerge attestatie. Geen aanname over gerealiseerde conversies, afspraken of omzet.
