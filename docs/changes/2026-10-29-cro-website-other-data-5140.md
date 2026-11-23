# Andere data — website- en CRO-bewijs (29 oktober 2026)

## Wat verandert er voor de gebruiker?
In Portaal V2, onder **Data & intelligence → Andere data**, is een aparte eigenaarspagina voorbereid voor websitecijfers en alle canonieke CRO-experimenten. Experimenten tonen hypothese, pagina, controle/variant, meetpunt, treatment/holdout, minimumsteekproef, bewijsstatus, baseline, resultaat, advies en besluit. Er komt geen tweede database of scheduler bij.

## Waar komt de data vandaan?
De beheerder leest de bestaande Supabase projecties via een beveiligde Netlify Identity admin-API:
- \`growth_page_daily\` voor de laatste 30 dagen website-observaties;
- \`powerhouse_experiment_learning_v2\` met tenant \`canonical\` (111 experimenten waargenomen; de 111 tenant-kopieën van \`bedrijfsgeheugen\` worden niet dubbel geteld);
- \`powerhouse_experiment_policies\` voor statistische minimumcriteria.

Websitebezoeken zijn geen gegarandeerde unieke menselijke bezoekers. De 731 geobserveerde formulierverzendingen in zeven dagen waren alle als bot geclassificeerd, dus niet als leads te tellen.

## Meetketen
De bestaande \`assets/meting.js\` blijft de ruwe privacyarme interactiebron. Voor primaire CTA's, klik-op-mail/tel en formulierintenties komt daar bij **analytics-toestemming** de bestaande duurzame \`/api/growth-event\` queue bij. Geen ruwe formulierinhoud, e-mail, telefoon of vrije kliktekst meegestuurd. \`form_submit_intent\` is geen succesvolle backend-lead.

## Veiligheid, foutafhandeling, beperkingen
De nieuwe API is alleen beschikbaar voor Netlify Identity-beheerders en retourneert geen service-role key, ruwe klantdata of persoonsgegevens. Een onbereikbare bron is \`UNAVAILABLE\`; overschrijding van rijenlimiet is \`TRUNCATED\`. Experimenten zonder causale onderbouwing mogen niet zelfstandig promoveren. De historische raw sendBeacon ACK/dedupe-bug is **niet opgelost** met deze PR en staat onder incident #5141.

## Definitie van live
Code in een concept-PR is **niet live**. Alleen beschermd mergen, Netlify exact release-SHA, browser twee-tenant autorisatie en onafhankelijke Supabase event-readback sluiten de claim. Tot dat moment staat alles op **PENDING VERIFICATION**.

## Uitbreiding — onafhankelijk verifieerbare resultaatlagen

Het beheerderportaal **Andere data** vraagt nu ook de bestaande, service-role-only Supabase-views `powerhouse_cro_conversion_evidence_v1` en `powerhouse_cro_experiment_evidence_v1` op (migraties in beschermde PR #5143). Er wordt geen tweede schrijver, tabel, experimentmanager of scheduler gemaakt. De twee extra views leveren het expliciete onderscheid tussen persistente CTA-events, dagaggregatie, geregistreerde leads, gekoppelde kwalificatierecords en orders met vastgelegde providerreferenties. Zelfs een providerreferentie is niet automatisch onafhankelijk bevestigd betaald bewijs. Daarom blijven de kaarten **Onafhankelijk bevestigde betaalde orders** en **Onafhankelijk bevestigde omzet** leeg/onbekend zonder een apart geverifieerd betalingsbewijs.

De experimentweergave onderscheidt minimaal benodigde en volwassen treatment/holdout-toewijzingen. Ontbreekt één van beide views, dan is het API-resultaat `PARTIAL` (HTTP 206), niet `LIVE`; in het portaal verschijnt `UNAVAILABLE` en geen fictieve conversie- of omzetwaarde. De bestaande dagtotalen worden nadrukkelijk als **geregistreerd en nog te verifiëren** aangeduid. De bestaande Identity-admincontrole, `canonical` tenant-scope, `private, no-store`, en service-role-only credentials op de server blijven intact. Bewijsviews bevatten uitsluitend geaggregeerde/gesaneerde velden.

**Release-volgorde:** eerst #5143 beschermd mergen en database-migraties + Netlify-versie aantoonbaar opleveren; daarna #5140 met eigen Required/CodeQL en geauthenticeerde portaalreadback, inclusief apart ingelogde twee-tenantcontrole. Zonder echte partner-/lead-/factuur-/paymentproviderreadback zijn geregistreerde records geen bewezen orders of omzet. Bronreferenties, besluiten, fouten en CI-run-SHA worden in dezelfde ONE BRAIN/Heartbeat-incidentlineage gelogd. Tot alle bewijzen bestaan blijft `OUTCOME_UNVERIFIED` correct.
