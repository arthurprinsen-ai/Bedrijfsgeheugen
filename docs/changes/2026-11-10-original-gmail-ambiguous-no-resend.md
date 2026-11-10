# P0 — 10 november 2026: geen tweede Gmail-verzending bij onzekere provider-ID

## Geobserveerd productiegedrag
Na bewezen herstel van research → originele composer in PR #5572 verwerkte oorspronkelijke commerciële cron #116 een e-mail. Er werd een provider-message-ID ontvangen, maar de onafhankelijk opgehaalde Gmail-reactie gaf `GMAIL_READBACK_MISMATCH` (`id_matches=false`, `sent_label=true`, `recipient_matches=true`). Dit bewijst geen afleverstatus en mag niet als `done` of gerealiseerde omzet tellen.

Dezelfde originele actie stond vervolgens op `prepared`, **terwijl** `autonomous_outbound.needs_readback=true`, `republish_forbidden=true` en een provider-ID aanwezig waren. De exacte writer die hem opnieuw voorbereidde is nog niet onafhankelijk vastgesteld; de herstatussering is de gevaarlijke invariantbreuk. Er is **geen bewezen tweede e-mail**.

Om 10:40 UTC is uitsluitend deze oorspronkelijke actie via een geconditioneerde, atomische productie-update terug op `waiting` gezet met intact provider-ID, `needs_readback=true` en `provider_ambiguity_quarantine.external_resend_forbidden=true`. Dit was directe schadepreventie, geen providerverificatie of permanente bugfix.

## Permanente veilige oorspronkelijke reparatie
De bestaande `powerhouse-autonomous-outreach` krijgt een hard no-resend guard **vóór** iedere Gmail-verzending. Elke opnieuw `prepared` gezette actie die een provider-ID, `needs_readback`, `republish_forbidden` of quarantine bewijs draagt, wordt atomisch naar dezelfde originele `waiting` gezet zonder `GMAIL_SEND_EMAIL`; de originele pending-readback route controleert uitsluitend het **oorspronkelijke** provider-ID. Het previewpad telt deze gevallen niet meer als verzendbaar. Dezelfde `_shared/outreach-composer-hold.mjs` bevat de deterministische predicate, met historische/shadow/canary-test. Geen tweede cron, queue, account, handmatige resend, sender, database-schematruc, vervalst succes of afgezwakte consent.

De oorzaak van de eerdere herstatussering wordt niet geraden; de nieuwe zendgrens geldt ongeacht welke bestaande upstream writer `PREPARED` produceert. De autonome originele executor blijft actief.

## Terminale eisen
Protected Required/CodeQL → merge via bestaande regels → officiële productie Edge-deploy → onafhankelijke source equality/readback → werkelijke volgende poging met provider-evidence behoud en **geen tweede Gmail-send** → aparte geldige provider-ID/SENT/recipient readback → resultaat/experiment → BRAIN en Heartbeat. Geen groen zonder die laatste bewijsstappen.
