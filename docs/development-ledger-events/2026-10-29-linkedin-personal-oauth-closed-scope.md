# Ontwikkelregistratie: LinkedIn r_member_social unauthorized_scope_error

- **Datum:** 2026-10-29 20:29 Europe/Amsterdam.
- **Exact gebruikersbewijs:** officiële Composio→LinkedIn OAuth toont `Failed to connect` en `unauthorized_scope_error`.
- **Bron:** oorspronkelijke production `powerhouse-composio-linkedin-setup` Edge v478, actie `create_personal_link`, aanvraag #16058, verbinding was nog niet ACTIVE; persoonlijke LinkedIn `APPROVED` zonder provider-ID; eerdere productie-healthcheck negen ACTIVE-gelabelde, nul gezonde LinkedIn-accountkoppelingen.
- **Oorzaak:** oorspronkelijke scopes verplichten `r_member_social`, door LinkedIn aangemerkt als restricted / closed. Bestaande `configs.find` hergebruikt precies die verboden combinatie, waardoor dezelfde fout terugkomt.
- **Herstel:** originele owner-bound personal OAuth verandert uitsluitend naar `openid/profile/email/w_member_social` en selecteert enkel exacte scopes. Nieuwe connectoropdracht met bestaande account, géén extra publisher. Geen publicatie in deze PR.
- **Beveiliging:** `w_member_social` blijft vereist voor schrijven; geen readback vervalsen; originele globale duplicaatclaim en provider-ID + onafhankelijke effectcontrole blijven vereist; LinkedIn app-approval of menselijke OAuth-toestemming mag niet autonoom worden omzeild.
- **Verificatiepad:** exact-head CI, beschermde merge, Supabase Edge-versie, productie-aanvraag en ownerconsent, provider-ID/readback. Bij ontbrekende externe toestemming blijft kanaal rood. Stop niet de reguliere executor.
- **Terugdraaien:** alleen beschermde revert binnen originele setupfunctie. Geen handmatige wijzigingen aan claims, provider-ID’s of opgegeven OAuth-toestemming.
