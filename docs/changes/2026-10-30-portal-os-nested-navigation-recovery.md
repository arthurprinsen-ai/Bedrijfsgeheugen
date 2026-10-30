# 30 oktober 2026 — Portal V2 interactieve adviesnavigatie hersteld

## Incident / oorzaak
Na protected PR #5211 bevatten het strategisch adviseurscherm en de geopende Next Best Actions-module nieuwe `data-os-page`-knoppen. De cockpit bond alleen bij de eerste render click handlers aan de dan bestaande knoppen. `mountOperatingSystemPage` vervangt later de module-inhoud met `innerHTML`; nieuw gegenereerde knoppen hebben daardoor geen click handler. Dit is een uitvoeringsfout in UI-navigatie, niet een aanwijzing dat data, tenantisolatie of externe agents stuk zijn.

Fingerprint: `portal|operating-system|nested-page-navigation-unbound|20261030-v1`.

## Herstel binnen de oorspronkelijke Powerhouse–ONE BRAIN–Heartbeat-lus
De bestaande `mountExecutiveCockpit` koppelt één gedelegeerde click listener aan de persistente `.os-executive-host`, met een expliciete `host.contains(button)` controle. Zowel initiële tabbladen als pas later gerenderde `data-os-page`-knoppen roepen dezelfde `openModule` en dezelfde `OPERATING_SYSTEM_PAGES` whitelist aan. De actuele canonieke `__BG_PORTAL_DOMAIN_STATE__` wordt bij navigatie gelezen, niet bij de eerste render vastgezet. Na rerenders wordt geen tweede listener toegevoegd.

Geen extra router, browseropslag, tweede ONE BRAIN, scheduler, provider, write API of marketingevents. Bestaande besluitvorming en voorwaarden voor bewijs, consent en RLS blijven ongewijzigd.

## Onafhankelijke regressie
`tests/brain-portal-os-delegated-navigation-20261030.test.mjs` controleert navigatie vanaf dynamisch toegevoegde knoppen, correcte moduleweergave, state-verversing, slechts één event listener na herhaalde mounts, en het negeren van buitenstaande/ongeldige doelen. Alleen protected Required/BRAIN/CodeQL en exact main→Netlify→browser→tenantproof kunnen een live claim rechtvaardigen. Een succesvolle code-test is geen bewezen omzetgroei.

## Commerciële leerlus
De reparatie maakt bestaande adviezen toegankelijker maar mag geen verbeterde likes, bezoekers, leads of orders voorspiegelen. De originele Growth/CRO-funnel blijft eigenaar van de meting post → website → CTA → opt-in/lead → providerbevestigde order → onafhankelijk resultaat → ONE BRAIN. Pas bij echte vergelijkbare cohorten en providerreadback mag een verbeterclaim volgen.
