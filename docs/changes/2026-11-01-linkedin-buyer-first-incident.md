# Incident 1 november 2026 — LinkedIn te technisch en onvoldoende gericht op ondernemers

**Status:** herstelcode kandidaat op beschermde branch; nog geen productie- of impactbewijs. **Bestaande owner:** oorspronkelijke Powerhouse content-orchestrator, prepublish reviewer, social publisher, social metrics & CRO learning. **Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439; leveringsincident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232.

## Observeerbaar probleem en oorzaak

Op 1 november toont de gebruiker een daadwerkelijk zichtbaar persoonlijk LinkedIn-bericht, gekoppeld aan de in originele Supabase-verplichting geregistreerde LinkedIn-ID `urn:li:share:7522660274441670656` (status `PUBLISHED`, maar `live_proven_at` staat op dat moment leeg). Het bericht opent met “Ik wil dat AI niet alleen signalen geeft” en noemt 273 gemeten pagina’s, 30 bronnen, 2 goedgekeurde AI-modellen, 280 klaargezette acties, 22 uitgevoerde acties en 4 rode/3 amber signalen. Dat kan intern nuttig zijn, maar biedt geen directe, concrete klantcasus voor ondernemers en beslissers. Het screenshot toont **geen echte views, kwalitatieve reacties, aanvragen of orders**.

**Root cause:** het bestaande AI-native builder-script voedt de persoonlijke founder-post met een technische Powerhouse-statusverhaallijn. De prepublication-redactiegate `personal-linkedin-founder-editorial-v3` verbiedt enkele termen maar mist de combinatie van generieke AI-missie plus interne cijferdump. Voor het bedrijf ontbreekt een specifieke check op deze statuscijfers. De huidige sociale CRO-analyse meet engagement apart van de tekstkwaliteit; een gepubliceerde post is geen bewezen converterende post.

## Herstel, bescherming en bewijs
1. Bestaande personal- en company-shared prepublication validators afkeuren generieke AI-openingen en internestatus-getallen; personal-v4 en company-v2, met exacte screenshot-regressies. Oprichter blijft authentiek, 130–200 woorden, brongetrouwe observatie, geen onjuiste eerstehands claims, geen commerciële CTA.
2. De oorspronkelijke content-orchestrator instrueert de **eerste regels** te schrijven vanuit één relevant ondernemersprobleem, zakelijk gevolg en bruikbare les. Bij reject maximaal één nieuwe brongecontroleerde revisie, alle originele gates opnieuw.
3. Bestaande social-CRO-agent-skill stuurt formatvariatie (tekst, native PDF-carrousel met werkelijk goedgekeurd asset, multi-image, echt demonstratiebeeld), story family, hook en buyer segment aan; dat zijn experimentele hypotheses, geen gegarandeerde algorithm-hacks.
4. Het bestaande beheerportaal **Andere data** laat policy-versies plus `PER_POST_IMPACT_UNVERIFIED` zien, naast de al bestaande kanaalmetingen; code, publicatie, contentkwaliteit, leads en orders worden nadrukkelijk niet samengevoegd tot één groene vlag.
5. ONE BRAIN fingerprint `powerhouse|linkedin|public-internal-status-instead-of-buyer-story|20261101-v1` legt observation, oorzaak, originele eigenaar, afgesproken bronfix, regressies en toekomstig natural-run-/providerbewijs vast. Het oude publieke bericht wordt niet dubbel gepubliceerd of achteraf als gewist geclaimd.

**Verificatiepoort:** protected Required/BRAIN/CodeQL → protected merge → exacte Supabase Edge source parity voor generator, reviewer, publisher en Netlify portal READY → de eerste **nieuwe en originele** post die door dezelfde contracten komt → onafhankelijke provider-ID/readback → leeftijdsgelijke 48-uurs engagement en 7-daagse conversie -> brongeattribueerde leads, offertes en geverifieerde betaalde orders → ONE BRAIN learned/apply-next-post en regressiecontrole. Bij ontbrekend bewijs blijft `VALIDATED` of `EVIDENCE_PENDING`. Niet alle likes/views zullen elke dag stijgen; statistische trends en klantwaarde zijn de maatstaf.

**Bron van redactionele interpretatie:** LinkedIn official 2026-03-12 https://news.linkedin.com/2026/ImprovingTheFeed — minder generieke herhaling en engagementbait; meer authentieke, relevante inzichten. Dit is geen onderbouwing dat één bepaald format altijd wint.

**Veiligheidsregels:** één originele scheduler, één exclusieve writer, oude post nooit dupliceren, geen Make/Buffer parallel, geen niet-goedgekeurde bron of fictieve cijfers, privacy/GDPR, OAuth/identity/face-verificatie, blog-CMS en noodzakelijke menselijke toestemming ongewijzigd.
