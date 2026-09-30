# Powerhouse Loop Assurance — terminale live-borging

Datum: 30 september 2026  
Fingerprint: `powerhouse|loop-assurance|terminal-live-closure|2026-09-30-v1`

Powerhouse behandelt een gesloten loop voortaan als een continu opnieuw te bewijzen invariant, niet als een historische status.

De bestaande vijf-minutencontroller controleert actieve loops op:
`input → decision → action → readback → outcome → measurement → learning → guard`.

De controller gebruikt uitsluitend actuele canonieke evidence. Ontbrekende of stale evidence blijft non-green. Nieuwe actieve loops worden automatisch meegenomen via de centrale registry.

## Bewezen productie-identiteit

De v3-wijziging is beschermd gemerged naar `main` op:
`9ae500bb184c5e36053c7ca64fb2d51bea070d9c`.

Netlify rapporteerde vervolgens productie `ready` op exact dezelfde commit, gepubliceerd op 29 september 2026 om 19:31:30 UTC.

De live Supabase-readback direct daarna rapporteerde 13 actieve loops:
- 2 GREEN;
- 11 AMBER;
- 0 RED;
- 2 volledig 8/8 bewezen.

De twee volledig bewezen loops waren `autonomous-outreach` en `source-backed-outbound`.

## Permanente regel

Een merge, scheduler, provider-ACK of eerdere GREEN-status is nooit genoeg. Iedere loop moet zijn actuele evidence opnieuw kunnen aantonen. Skills, agents en chats erven deze regel via het repository-native contract en de canonieke System Map.
