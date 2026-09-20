# Powerhouse Control Center — beveiligingsmodel

Het Control Center is intern beheerfunctionaliteit. De beveiliging bestaat uit meerdere lagen:

1. Netlify Identity authenticatie is verplicht.
2. De dedicated observability API voert server-side autorisatie uit.
3. Alleen expliciete Powerhouse-adminrollen of accounts in de productie-allowlist worden geaccepteerd.
4. Tenant-scoping en de bestaande object-access-policy blijven gelden.
5. De browser krijgt geen observability-data vóórdat de admincheck succesvol is.
6. Er is bewust geen fallback naar de gewone `/api/brain-operating-loop`.
7. Responses zijn `private, no-store` en `noindex`.

Een gewone ingelogde klantgebruiker mag dus niet voldoende zijn om dit interne dashboard te lezen.
