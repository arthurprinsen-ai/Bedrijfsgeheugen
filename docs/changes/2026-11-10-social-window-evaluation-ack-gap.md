# Posts leren weer door: verplichte ontvangstbevestiging na de meting

## Wat ging structureel mis?
Een post kon daadwerkelijk gemeten en geëvalueerd zijn, terwijl de eerder aangemaakte meetverplichting nog op OPEN stond. De oorspronkelijke social-learning-agent kon een fout opschrijven, maar niet aantoonbaar bevestigen dat de afnemende stap het juiste herstel had verwerkt. Daardoor ontstond terugkerend werk zonder sluitende feedback.

## De wijziging
De **bestaande** uurlijkse social-learning-agent doet nu zelf de controle na iedere evaluatie: klopt exact de klantomgeving, postidentiteit, provider-waarneming, gemeten 24/48/72-uursvenster en oorspronkelijke evaluatie? Alleen dan schrijft hij een niet-duplicerende ontvangstbevestiging in de oorspronkelijke verplichting. Een retry opent die bevestiging niet opnieuw. Alle rollen blijven binnen hun oorspronkelijke bevoegdheid; niets wordt parallel gepland of opnieuw gepubliceerd.

Een meet-ACK is géén bewezen verbeterde post. Betrouwbare causale resultaten, e-mail, echte leads, betaalde orders en een aantoonbaar verbeterde volgende post hebben hun eigen bewijsstappen. Een gedeeltelijke providerinzage of een later opgevraagde dagstatistiek mag het ontbrekende oorspronkelijke uurvenster niet faken.

## Borging voor alle agents
De centrale agent-registry en twee bestaande skills eisen voortaan **direct diagnosticeren → daadwerkelijk herstel binnen bevoegdheid → exacte overdracht en readback → regressietest → eigen bestaande natuurlijke uitvoering**. Geen statuslijst als vervanging voor uitvoerbaar herstel. Providerbeperkingen blijven correct gekoppeld aan één verantwoordelijke en hetzelfde incident. De oorspronkelijke dagelijkse publisher en de oorspronkelijke hourly/social-leerlus blijven actief.

## Acceptatie
Regressie `tests/brain-social-obligation-evidence-ack-20261110.test.mjs`; originele GitHub Required + CodeQL; na merge exacte Supabase-Edge en Netlify-productiecontrole en eerste natuurlijke ontvangers-ACK. Afzonderlijk bewijs van leerregelgebruik op een volgende echte post en effecten blijft noodzakelijk.

Werkregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
