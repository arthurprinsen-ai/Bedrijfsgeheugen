# Trusted Advisor — één bewijsgerichte kwaliteitsnorm (2 november 2026)

## Geconstateerd gat en scope
Bedrijfsgeheugen heeft reeds originele contentproducenten, de centrale redactieraad, LinkedIn-contracten, een CMS-servercontrole, portaaladvisering en een commercieel meet- en incidentbrein. De lat ligt hoger: een ondernemer moet ons deskundig, relevant, geloofwaardig, zorgvuldig en onafhankelijk ervaren op website, portaal, social, blog en e-mail. Aantoonbare klantenwaardering of stijgende conversie is **niet** afgeleid van die ambitie.

De herhaalbare risico’s zijn interne CI/PR/release-informatie in commerciële teksten, conceptinstructies die naar buiten lekken, ongefundeerde kwantitatieve resultaatclaims, loze garanties, onduidelijke CTA’s, inconsistente verhalen of fictieve klantbewijzen. Niet al deze risico’s kunnen met regex worden opgelost; AI-claimcontrole, feitenreview, identiteit, toestemming, bereikbaarheid en menselijke verantwoordelijkheid blijven van toepassing.

## Bronwijzigingen binnen de originele autoriteit
- `assets/trusted-advisor-quality.mjs` levert een pure, conservatieve beoordeling; geen autonome goedkeurder, extra provider of datastore. Detecteert uitsluitend duidelijke fouten en geeft expliciet aan dat bronvermelding geen onafhankelijk bewijs is.
- `assets/cms-quality-gate.mjs` past deze beoordeling toe voor originele website/portaal/shared CMS-tekst, link, meta en HTML. Blokkerende copyfouten stoppen de bestaande server-side publicatiepoort; andere uitingen vragen nog altijd menselijke review. Het bestaande CMS blijft de enige schrijver.
- De originele `supabase/functions/_shared/editorial-council-context.mjs` draagt de norm als adviesbrief naar dezelfde oorspronkelijke generator voor LinkedIn persoonlijk/bedrijf, Instagram, blog, nieuwsbriefconcept en rechtmatige individuele outreach. De originele onafhankelijke kanaalpoorten blijven beslissend: dit is **nog geen uniforme harde social/e-mail-sendergate**.
- Het bestaande geauthenticeerde executive cockpit benoemt de kwaliteitscontrole en de bewijsgrens. Het portaal krijgt geen fictieve groene vertrouwensscore; een CMS-review is geen gemeten effect.
- `AGENTS.md` en twee bestaande redactie-/CRO-skills maken toetsbaarheid, eigenaar, incidentleerregel en herstel na herhaling verplicht.

## Kwaliteitscontract voor menselijke eindredactie
Voor elk kanaal: herkenbaar ondernemersprobleem, feitelijke context, werkelijke oorzaak/gevolg, praktische aanbeveling, duidelijke en passende vervolgstap, zichtbare beperkingen van bronbewijs, passend onderscheid van doelgroep, respect voor privacy en rechten. Reviews, cases en resultaatcijfers mogen alleen als echt worden gepresenteerd met controleerbare provenance en rechtmatig gebruik. Geen verzonnen succesverhaal, AI-superlatief, technisch intern statusrapport, misleidende garantie of onduidelijke afzender. NL/EN taal- en beeldconsistentie, mobiele weergave, werkende links, afmeldroute en originele toestemming worden onafhankelijk getest.

## Incident en kwaliteitslus
Fingerprint: `powerhouse|trust|customer-facing-editorial-proof-gap|20261102-v1`.
Registreer als originele bron-observatie met eigenaar, datum, bewijs, grondoorzaak en herstel; hergebruik fingerprint bij herhaling. Iedere nieuwe afkeur krijgt een veilige correctie, bestaande CMS- of originele publisher-eigenaar, regressie en latere readback. Een succesvolle codegate is `IMPLEMENTED_CANDIDATE`, geen garantie op foutloze productie. Persoonlijke/klantdata en geheimen nooit in publiek incidentbewijs.

## Bewijs voor release en klantwaarde
1. Lokale node regressies en originele CMS- plus redactiechecks, geen verzwakking van eerdere voorwaarden.
2. Protected Required/CodeQL, actuele BRAIN/terminal, exacte commit en System Map consistent.
3. Beschermde main-merge en live Netlify SHA/browserreadback; eventueel vereiste Supabase originele functie-deploy exact controleren.
4. Na echte beheerderstoestemming CMS-versie en zichtbare publieke content onafhankelijk uitlezen, kanaalprovider-ID voor een daadwerkelijk verzonden post/e-mail waar beschikbaar.
5. Meet klachten, correcties, kwalitatieve reacties, afmeldingen, gekwalificeerde gesprekken, conversie en onafhankelijke betaling met correcte bron en tijdvenster. Zonder voor-na/cohort blijft klantvertrouwen, impact en ROI `UNKNOWN`.

Uitdrukkelijk niet: publicaties automatisch goedkeuren, bestaande publisher uitzetten, duplicate gates omzeilen, geheime data publiceren of rode tests groen verklaren.
