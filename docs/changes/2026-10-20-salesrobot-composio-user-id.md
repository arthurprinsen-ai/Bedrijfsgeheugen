# 20 oktober 2026 — Composio SalesRobot HTTP 400 structureel herstellen
P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Reproductie
De productiefunctie `powerhouse-linkedin-sales-machine` v22 antwoordde bij een veilige dry-run HTTP 200 met `provider_probe_error=COMPOSIO_SALESROBOT_LIST_LINKEDIN_ACCOUNTS_400`. De Composio-koppeling had wel twee actieve SalesRobot-connected-accounts. Twee direct vanuit de bestaande Supabase runtime uitgevoerde read-only `SALESROBOT_LIST_LINKEDIN_ACCOUNTS`-aanroepen mét `user_id` uit dezelfde accountrecord kwamen beide terug met HTTP 200, inhoudelijk DISCONNECTED/cookie verlopen, trial verlopen, campagne gepauzeerd.

## Oorzaak en fix
Het Composio v3.1 transport bouwde alleen `connected_account_id` en `arguments` op, maar geen `user_id`. Voeg het bestaande accountgebonden `user_id` toe aan zowel de providerprobe als de bestaande geautoriseerde verzendroute, met verplichte identiteitscontrole, timeout en correct geserialiseerde providerfout. Geen secrets in code of chatlogs, geen herauthenticatieomweg, nieuwe scheduler of alternatieve verzendroute.

## Belangrijke grens
HTTP 200 op read-only accountprobe bewijst niet dat DM's verzonden kunnen worden. SalesRobot blijft niet inzetbaar totdat licentie, cookie en campagne echt hersteld zijn. Human approval, ontvangersautoriteit, no-double-send, suppressions/cooldown en providerreadback blijven van kracht.

## Closure
Required + CodeQL + native preview en beschermde merge; productie Edge-compile/readback; na deploy veilige dry-run moet `provider_probe_error` niet meer `COMPOSIO_*_400` zijn en de werkelijke offline/billing blokkade zichtbaar maken. Externe commerciële end-to-end acceptatie blijft apart.

