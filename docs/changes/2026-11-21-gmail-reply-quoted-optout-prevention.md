# 21 november 2026 — Gmail reply: geciteerde eigen afmeldzin is geen ontvangersinstructie

**Owner:** bestaande `powerhouse-email-reply-loop`. **Issue:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/6095. **Status:** CANDIDATE_NOT_LIVE tot werkelijke merge en exacte providerbevestiging.

## Reproduceerbare oorzaak
De bestaande reply-agent doorzocht de volledige Composio Gmail `messageText` (of `preview.body`) en gaf op elke substring ` afmelden` direct `unsubscribe` terug. Sinds de originele Gmail-verzender van PR #6094 aantoonbaar live is, bevat elke verstuurde zakelijke e-mail de expliciete instructie om met "afmelden" te antwoorden. Gmail-citaten van die eigen tekst kunnen in een echte inkomende reactie terechtkomen.

Risico: ontvanger antwoordt "Interessant, stuur het voorbeeld maar", en de automatisch geciteerde oorspronkelijke afmeldzin wordt ten onrechte als opt-out gelezen; bestaande `powerhouse_email_contact_suppressions` krijgt dan een onterechte stop, `powerhouse_sales_outcomes` mist interesse en Heartbeat leert het verkeerde effect. **Productie-audit:** vier historische reply-eventrecords, geen bewezen foutieve unsubscribe met geciteerde footer. Daarom classificeren we dit als **preventieve regressie**, niet als bestaand getroffen contact. Geen suppressie automatisch opheffen.

## Gebouwde minimale veilige reparatie
1. Hergebruik originele Supabase Edge Function `powerhouse-email-reply-loop` en dezelfde Gmail Composio-verbinding, tokenautorisatie, action IDs, provider IDs, SQL-eventtabellen, duplicate checks en learning refresh.
2. Nieuwe pure oorspronkelijke helper `supabase/functions/_shared/email-reply-visible-text.mjs` scheidt bovenste eigen reply van Gmail quote headers, gequote tekst en de eigen merkafmeldvoet. Dit is slechts tekstclassificatie, geen tweede executor.
3. E-mailinhoud wordt eerst `extractVisibleEmailReply` en pas daarna `classify`, event-insert en eventueel suppressie. Geen nieuw geschreven inhoud = geen nieuw replyevent en geen verstuurde mail; `quoted_only_skipped` is een diagnostiekveld op de bestaande gezondheid.
4. `isExplicitUnsubscribeReply` accepteert nog steeds echte stopverzoeken ("Afmelden", "Mail me niet meer", "Please unsubscribe") maar nooit een woordvermelding, ontkenning of de eigen footer. Echte suppressies blijven ongewijzigd bindend.
5. Historische replay en tests `tests/brain-email-reply-quoted-footer-20261121.test.mjs`, plus aangepaste oorspronkelijke `tests/brain-autonomous-outreach-optout-line-20261027.test.mjs`.
6. Borgen in bestaande `.agents/skills/powerhouse-relationship-revenue/SKILL.md` en ONE BRAIN learning `brain/learning/2026-11-21-email-reply-quoted-outbound-optout-guard.json`. Niet afwijken naar nieuwe agents, schedules, mailservers, privacyconsent of klantdata-export.

## Acceptatie en effect
Technisch: beschermde Required backend/regressie, CodeQL, merge naar protected main; de bestaande Supabase GitHub-integratie publiceert en oorspronkelijke provider-download toont exact dezelfde function + gedeelde dependency-bytes. Operationeel: echte nieuwe Gmail provider-readback met juiste reply-event-identiteit en daadwerkelijk ontvangersverzoek, zonder duplicate, valse opt-out of business effect uit synthetische tests te infereren. Verzendtoestemming voor de 605 CRM-contacten blijft een afzonderlijke onveranderde grens; nul gedocumenteerde `email_marketing_permission`-bewijzen was de laatste waargenomen cohortstatus. 

**Truth boundaries:** een groene CodeQL of vier bestaande replyevent-records betekenen niet dat een nieuw bericht is ontvangen of omzet geboekt. Geen bestaande outbound mail wordt opnieuw verstuurd. 

## CodeQL-review: veilige HTML-inname
De eerste kandidaat gebruikte een algemene HTML-tag-verwijderregex die CodeQL terecht als onvolledige sanering kon aanwijzen. De definitieve helper scheidt nu eerst geciteerde platte-tekstheaders waarin <afzender@email> voorkomt, herkent daarna alleen toegestane HTML-structuurtags en geeft bij onbekende/misvormde HTML een lege niet-classificeerbare reactie terug. Regresstests bewijzen onder meer: HTML met geciteerde afmeldvoet levert wel een positieve zichtbare tekst maar geen opt-out op; expliciet <p>Afmelden</p> is wél een verzoek; <script>, <img> en afgebroken markup genereren geen event of suppressie. Geen HTML-rendering uit inkomende Gmail-tekst.
