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
