# 2026-10-20 — SalesRobot DM alleen DONE na externe inboxverificatie
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Root cause
De bestaande Powerhouse LinkedIn-salesmachine zette een `waiting`-actie op `done` zodra Composio een succesvolle `SALESROBOT_SEND_MESSAGE`-response gaf, zonder bevestiging dat het bericht daadwerkelijk in de verzonden inbox staat. Dit suggereert onterecht een afgeronde commerciële actie. `action.evidence.human_approved` alleen volstaat niet om de CRM-ontvanger te autoriseren.

## Structurele correctie
- Voor DM verzenden: verifieer de bestaande connectie in `bg_connecties` op unieke sleutel/LinkedIn URL, `extra.human_approved=true` en geen do-not-contact/DM-verbod.
- Bij send-ack: leg response, provider-message-ID en prospect UUID vast; originele action blijft `waiting`, `needs_readback=true`, `republish_forbidden=true`, géén sent-outcome.
- Alleen een uniek onafhankelijk geobserveerd `salesrobot_linkedin_dm_sent`-runtime-event met exact inbox-message-ID, prospect UUID, `provider_inbox_readback=true`, `inbox_message_sent_by_me=true`, `SENT` en passend verzendtijdstip sluit de originele action af. De bestaande outcome-tabel krijgt eerst een gededupliceerde sent-outcome, daarna de action `done`. Dubbele of ontbrekende bewijsregistraties sluiten niets af.
- Geen tweede scheduler/sender/CRM en geen kunstmatige aanmaak van toestemming of providerbewijzen.

## Grenzen en acceptatie
De externe SalesRobot-trial, cookie en campagne blijven een aparte blokkade. Automatische provider-inboxevent-collectie is nog niet voor nieuwe berichten bewezen; tot dat bewijs bestaat, kan een nieuwe DM bewust `waiting` blijven. Required CI, CodeQL, preview, beschermd merge, exacte Edge-code en read-only productiecanary vereist. Volledige verkoopketen blijft rood totdat er daadwerkelijk correct geautoriseerde providerontvangst én outcome/learning is.
