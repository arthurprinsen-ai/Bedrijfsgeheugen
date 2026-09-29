# LinkedIn company write/read scope separation

## Incident
Op 29 september 2026 was de nieuwe LinkedIn OAuth-token voor de gebruiker geldig, maar `LINKEDIN_GET_COMPANY_INFO` gaf 403 terug wegens ontbrekende organisatie-read/admin scope. De runtime behandelde dit ten onrechte als bewijs dat publiceren naar de bedrijfspagina onmogelijk was.

## Root cause
De preflight koppelde twee verschillende LinkedIn-capabilities:
- schrijven als organisatie;
- organisatie-ACL/read toegang.

Historische productie-evidence liet al zien dat schrijven kan slagen terwijl aanvullende readback/API-verificatie beperkt blijft.

## Permanente correctie
De canonieke organisatie blijft `urn:li:organization:18234216` of de expliciet geconfigureerde `COMPOSIO_LINKEDIN_COMPANY_AUTHOR_URN`. `LINKEDIN_GET_COMPANY_INFO` is voortaan alleen corroboratie. Een 403 op die readcall blokkeert geen write-attempt meer wanneer de token-health en persoonlijke identiteit geldig zijn.

Een 401 of `REVOKED_ACCESS_TOKEN` blijft wél een harde OAuth-boundary. Een succesvolle create-response met LinkedIn URN blijft terminale provider-evidence en activeert de anti-duplicate fence.

## Regression gate
`tests/brain-linkedin-composio-capability-proof.test.mjs` controleert dat company write readiness niet opnieuw afhankelijk wordt gemaakt van `r_organization_admin`.
