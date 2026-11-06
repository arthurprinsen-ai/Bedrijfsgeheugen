# Vastgelopen publicatie volgt één lus: draaiboek, controle, escalatie

Datum: 6 november 2026
Obligation: `blocker-playbook-recovery-v1`

Elke gemiste publicatie wordt gekoppeld aan een blokkade-draaiboek (oorzaak, preventie, eigenaar), krijgt een controle-teller en escaleert naar de eigenaar als hij te lang vastzit. Een onbekende foutcode wordt automatisch een incident, zodat hij in het draaiboek en het register komt. Het draait in de bestaande uurlijkse run als aparte stap; er wordt niets opnieuw gepubliceerd. Eerste run in productie: 12 gemiste kanaal-dagen, 11 geëscaleerd met eigenaar, geen onbekende codes.
