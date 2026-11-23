# Portal V2 — Work & Process OS, eerste originele workflow-slice

Datum 2026-11-11. Original owner Portal V2, issue #4215; afhankelijkheid #4198. Fingerprint: `portal|work-process|source-aware-workflow-templates|20261111-v1`.

## Wat werkelijk is gebouwd
- Bestaande `taken-werkstromen`/delivery-board uitgebreid met één standaard ingeklapte procesweergave, niet een tweede portaal of scheduler.
- Vier herbruikbare procesvormen: productintroductie, herhaalbestelling, private label en zakelijke dienstverlening. Een sjabloon maakt een procesinstantie met eigenaar, afhankelijke stappen, optionele einddatum en backward-planning per fase.
- Bestaande `domainState.set('portal.deliveryPlan', ...)` en originele flush behouden exact dezelfde klantstaat en serverautoriteit. Features, stories, backlog en sprints blijven behouden.
- De oorspronkelijke aangevraagde stapstatus is uitsluitend klantinvoer: `submitted` betekent **niet** dat ONE BRAIN het onafhankelijk heeft verwerkt. Goedkeuring kan uitsluitend worden aangevraagd en niet via deze client worden verleend. Afhankelijke stappen blijven dan terecht geblokkeerd. Geen fictieve uitgevoerde leverancieractie, mail, meetuitkomst of learning.
- Mobile-first disclosure, keyboard focus, HTML escaping en echte lege toestand. Onbekende klantdeadline en onzekere eigenaar worden niet ingevuld.

## Welke releases dit NIET afsluit
Dit is een bronvastgelegde werklaag, geen universele server-side workflow-engine met reminders en bevoegde approver receipts. Ook nog nodig: exacte twee-tenant E2E write/readback per invoerveld, durable consumer ACK, authoritatieve approvals, notificatie via originele executor, originele Company Graph impact per relevante wijziging, Powerhouse uitvoering, Heartbeat outcome en next-run learning. Geen PR kan de bestaande zeven rode runtime-lussen, 433 historische contenthandovers of Red Dot jurybeoordeling als groen markeren.

## Acceptatie
`portal-v2/tests/process-portfolio.test.mjs`, `tests/brain-process-portfolio-20261111.test.mjs`, bestaande delivery-board tests en alle originele admission/Required/BRAIN/CodeQL. Alleen groene beschermde merge plus exact-current-main Netlify READY en onafhankelijke browser/tenant readback mogen als live worden gemarkeerd. Site-scans, prijzen en checkout blijven uit #5611; sitewide mobiele herstelcode uit #5613 blijft eigenaar van siteheader/menu. Geen wijziging aan de commerciële catalogus.

## Doorwerking naar de bestaande bedrijfsintelligentie
De originele Portal V2 impactmotor koppelt `portal.deliveryPlan` nu expliciet aan `taken-werkstromen` en markeert roadmap, mensen, businesscase, advies, wijzigingen en audittrail als relevante herbeoordelingen. Dat is een bronafhankelijkheidskaart binnen de bestaande Brain-handoff; geen uitvoering, geen berekende financiële baat en geen zelfstandig bericht naar een provider. De bestaande `PortalModel` BusinessInput-vangroute blijft leidend.
