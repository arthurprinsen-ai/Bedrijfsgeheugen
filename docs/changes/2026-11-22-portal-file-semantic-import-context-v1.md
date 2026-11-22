# Betekenis vóór importeren: CSV/Excel → juiste bedrijfscontext

22 november 2026 — bestaande Portal V2, één orignele ONE BRAIN/BusinessInput-keten.

## Gebruikservaring

1. Kies een .csv of .xlsx en krijg direct een veilige tabelpreview.
2. Portaal stelt op basis van de kolomnamen/bestandsnaam voor **welke gegevens** het zijn (omzet, facturen, klanten, service, voorraad, finance, HR, marketing, energie, projecten of onbekend). Bij twijfel noemt het voorstel die onzekerheid.
3. Portaal vraagt **waarom** (concreet bewerkbaar zakelijk doel), **waar** (beoogd bedrijfsdomein; geen stille daadwerkelijke KPI-mapping), **wat één rij is** (transactie, factuur, klant, incident, enz.) en **waar de export vandaan komt**.
4. Alle kolommen krijgen verklaarbare, corrigeerbare rollen (ID, datum, geldbedrag, getal, percentage, status, categorie, persoonsgegeven, tekst of onbekend); datumperiode en kwaliteit (lege cellen/duplicaten) worden getoond zonder gegevens te verzinnen, te verwijderen of te corrigeren.
5. Een expliciete reviewcheckbox is verplicht vóór opslag. Persoonsgegevens vragen een aparte verklaring van rechtmatige verwerking. Hooggevoelige velden (BSN, gezondheids/diagnosevelden, wachtwoorden/keys, paspoortnummers) blokkeren directe upload; bied alleen geautoriseerde veilige koppeling/compliance-review.
6. Bestaande `domainState.patch('portal.dataImports',...)` → `domainState.flush()` → originele BusinessInput/ONE BRAIN-ACK → server readback nu inclusief het *exacte* semantische contract (doel, rol, bestemming, herkomst, privacy, beperkingen). Identiteit, SHA-256 duplicate gate, retry en tenantveiligheid blijven leidend.

## Grenzen

- Bestemming is een **beoogd bedrijfsdomein**, niet een bevestigde koppeling met een KPI of rapport; data wordt niet automatisch over andere `portal.*`-secties heen geschreven.
- De opgeslagen bron is `readOnlyAnalysis=true` en `automaticKpiWrite=false`; geen automatische externe acties of relatie-merges.
- Classificatie is expliciet op patroonherkenning gebaseerd, geen server-side AI-model of autonoom semantisch begrip geclaimd. Onbekende of dubbelzinnige datasets krijgen **'Andere bedrijfsgegevens'**, totdat de gebruiker ze bevestigt.
- Voor werkelijk consistente klantdata vanuit terugkerende systemen zijn bestaande koppelingen gewenst. Bestanden hebben geen permanente synchronisatie.
- Door import ontstaan geen bewezen trends, AI-inzichten, KPI-effecten of signalen; daarvoor zijn aparte semantische controles, autorisaties, bekende units/aggregatieregels en Heartbeat-effectmeting nodig.

## Bewijs

Regressietest: `node --test tests/brain-portal-v2-import-context-v1.test.mjs`. Beschermde PR/CodeQL/Required en exacte Netlify productierelease + ingelogde klantimport met onafhankelijke readback vereist. Documentatie of READY alleen is niet genoeg.
