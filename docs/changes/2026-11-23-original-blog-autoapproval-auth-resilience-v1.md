# Dagelijkse blog: goedkeuring terug naar de oorspronkelijke bron-eigenaar

**23 november 2026 · Oorspronkelijke eigenaar:** `powerhouse-content-loop` → `powerhouse-blog-queue` → `powerhouse-daily-blog.yml`; incident [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).

## Gemeten defect
De bestaande GitHub Actions blog-publiceerder faalde in [run 45142661254](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45142661254) al bij `BLOG_AUTO_APPROVAL_READ_FAILED:powerhouse_content_artifacts:401`, vóór een artikelkandidaat. Hetzelfde originele Supabase-bronartikel stond op 23 november op `content_ready`, de beslissing op `publish`, een geldige slug/ID was aanwezig, er was geen veto en het zesuursvenster was verlopen. Met de *reeds bestaande* `record_content_publication_state`-functie is de 23-november-verplichting om 09:31 UTC onder exact dezelfde toelatingsvoorwaarden naar `APPROVED` gegaan; de oorspronkelijke GitHub-publiceerder maakte vervolgens [PR #6123](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6123). Dit is een eenmalige herstelobservatie, geen bewijs dat de volgende ochtend vanzelf werkt.

## Structurele correctie zonder extra uitvoerder
`powerhouse-blog-queue`, reeds aangeroepen door de oorspronkelijke `powerhouse-content-loop` binnen bestaande cron #140, hergebruikt nu de **zelfde** pure `decideBlogAutoApproval`. Alleen na geldige actuele Amsterdam-datum, `GENERATED`, bron- en beslissingstrouw, geldig goedgekeurd artikel, juist officieel feit, ontbrekend veto en zes verstreken uren schrijft dezelfde oorspronkelijke queue via `record_content_publication_state`. Het onafhankelijke bronreadback moet exacte `APPROVED`, slug, content-ID en auto-approval-versie bevestigen. Geen directe SQL-update van `approved_at`, nieuwe timer, permissie, credential, runner of provider.

Het bestaande GitHub-schema houdt uitsluitend de beveiligde **lezen**-poort over via de private oorspronkelijke `powerhouse-blog-export` met dezelfde bron-ID/datum, `reader_ready` en `APPROVED`-status. In het veto-venster meldt het `PENDING`, na 07:00 Amsterdam is ontbrekend brongoedkeuringsbewijs een expliciete fout. Zo wordt een stale GitHub PostgREST-credential niet meer de bottleneck van de oorspronkelijke brongoedkeuring. Het GitHub-secret is **niet** gerevoked of vervangen; individuele credentialvalidatie blijft een aparte beheergrens.

## Veilige acceptatie
Tests van de oorspronkelijke gedeelde helper (incl. veto, stale-datum, officiële CPNL-deadline en bronvalidatie) blijven gelden. Nieuwe test controleert exacte historische 23-november-oorzaak, serverqueue-inzet, externe exporter-alleen-lezen en geen nieuwe scheduler. Daarna Required + CodeQL + BG169, beschermde merge, Supabase Edge bronpariteit (productie), originele volgende urenrun, originele GitHub PR, Netlify exacte productie-SHA, openbaar artikel en per kanaal ONE BRAIN/Heartbeat feedback.

**Status: kandidaat.** Een groen workflowrun of PR is geen bewijs voor elke toekomstige dagelijkse publicatie. De persoonlijke en Instagram-specifieke inhoudskwaliteitsgrenzen blijven ongewijzigd.
