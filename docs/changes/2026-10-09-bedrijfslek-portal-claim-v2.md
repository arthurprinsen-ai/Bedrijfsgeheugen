# Bedrijfslek → ingelogd portaal: beveiligde en bruikbare claim (v2)

## Aangetoonde eerste stap
- PR #4286 is gemerged; Supabase Edge ACTIVE 13 is exact gelijk aan main.
- Powerhouse Scan Production Proof op main is groen, met echte `/zelfscan` POST + idempotente dubbel-POST.
- In database zijn één scan, runtime-event, signal-cycle en sequence-1 cycle-event aantoonbaar; geen echte omzet of klantclaim.

## Tweede stap: ontbrekende ingelogde portaaldoorwerking
1. De bestaande Portal V2 client werkt met `portalStateClient.authHeaders()` en Netlify Identity Bearer. De nieuwe scan-claim-bridge gebruikte eerst alleen same-origin cookies en kon hierdoor 401 geven, ondanks een ingelogde sessie. De bridge gebruikt nu **dezelfde** auth-header als de canonieke portal-state client.
2. Scanresultaat blijft volledig gratis zichtbaar voordat de backend opslaat. **Na providerbevestiging** wordt een niet-persoonlijke `submission_key` gedurende maximaal zeven dagen op hetzelfde apparaat herbruikbaar gemaakt, ook bij navigatie naar een ander tabblad.
3. De koppeling vereist de eigen expliciete actie van de geauthenticeerde klant, de server-tenantafleiding en een `claimed=true` plus `tenant_identity_status=verified` readback. Geen automatisch claimen.
4. Wisselt de ingelogde identiteit, dan wist Portal V2 de getoonde vorige scanhistorie, verhoogt de respons-revisie en haalt opnieuw data op. Oude in-flight aanvragen mogen niet over het nieuwe account heen tekenen.
5. De bestaande Edge claimroute weigert het opnieuw claimen van een al geverifieerde scan als de `company_key` niet bij dezelfde tenant hoort. Bij een legitieme slug-tenant wordt ook `klant_slug` weggeschreven, zodat `powerhouse_scan_history_v1` de juiste rows toont.
6. Geen nieuwe tabellen, cron, AI-provider, commerciële campagne of duplicaat Brain.

## Proof gating
Protected security, portaal- en backendtest, exacte Edge-source readback, Netlify productie-commit en één echte ingelogde klantclaim zijn afzonderlijke acceptatiecriteria. Geen klantidentiteit of commerciële omzet wordt gesimuleerd om P0 #4198 te sluiten.

Fingerprint: `powerhouse|bedrijfslek|authenticated-portal-claim|v2`.
