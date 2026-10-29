# LinkedIn persoonlijk: publicatie bestaat, onafhankelijke readback geweigerd

Datum: 29 oktober 2026. Autoriteit: bestaande ONE BRAIN / Powerhouse / Heartbeat, oorspronkelijke persoonlijke LinkedIn-publisher en beveiligd Powerhouse Control Center.

## Controleerbare feiten
- Oorspronkelijke OAuth-scopefix [#5159](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5159) is gemerged: persoonlijke toestemming bevat uitsluitend `openid,profile,email,w_member_social`. Het gesloten `r_member_social` wordt niet meer aangevraagd.
- Alias-herstel [#5163](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5163) is beschermd gemerged als `8a8d5c074fc6008e9bdf838317639e3f7b266ade`; Supabase `powerhouse-composio-linkedin-setup` werd exact-byte-gelijk uitgerold als ACTIVE v485 en een latere runtimecheck toonde v487 ACTIVE met die herstelfunctie.
- Oorspronkelijke `content_publication_obligations` voor `linkedin_personal`, 2026-10-29: `status=PUBLISHED`, `external_id=urn:li:share:7521667096859201536`, `live_proven_at=NULL`, `evidence.verification_pending=true`, `evidence.republish_forbidden=true`. De oorspronkelijke leescontrole en een afzonderlijke plugin-readback antwoordden `Forbidden / 403`. Daardoor is `LIVE_PROVEN` niet aangetoond.
- De persoonlijke nieuwe OAuth-toestemming is niet aantoonbaar afgerond. Het verzoek voor een verse link via beveiligde uitvoerroute werd door de uitvoeromgeving geblokkeerd. Een actieve plugin-koppeling is géén bewijs voor de oorspronkelijke productieconnector.
- LinkedIn bedrijf is apart `LIVE_PROVEN`, Instagram/Blog hebben eigen open verplichtingen.

## Oorzaak van de portaal-onduidelijkheid
De reeds beveiligde portaalreadback wist dat een extern provider-ID betekende *niet opnieuw publiceren*, maar gaf na een readback-403 alleen de generieke code `PROVIDER_CREATE_RECORDED_VERIFY_READBACK_NO_REPOST`. Daardoor werd de specifieke, onbeschikbare uitleesautorisatie niet verklaard.

## Bestaande veilige herstelroute
In dezelfde bestaande admin-only Netlify `/api/powerhouse-observability` wordt één extra server-only scalar `evidence->>readback_error` gelezen. Alleen een persoonlijke LinkedIn-post met bestaand provider-ID én expliciete `Forbidden/403/permission` krijgt code `LINKEDIN_PERSONAL_PROVIDER_CREATED_READBACK_FORBIDDEN_NO_REPOST`. Het bestaande Portal V2 Control Center vertaalt die naar begrijpelijke Nederlandse uitleg: bericht aangemaakt, onafhankelijke uitleescontrole geweigerd, nooit opnieuw publiceren, verifieer het bestaande bericht. Zonder provider-ID geen provider-created status; met bewezen `LIVE_PROVEN` blijft de bestaande uitkomstcode voorop. De originele autorisatie, RLS/JWT, provider-URN, token, link en ruwe fouttekst worden niet in het portaal geëxporteerd.

Geen nieuw endpoint, agent, scheduler, publicatiewriter of dubbel Composio-account. De bestaande sociale herstelagent-skill van #5163 blijft normatief; conflicterende portaal-PR #5164 blijft exclusief eigenaar van de afzonderlijke Control Plane-cockpit. Releasecriteria zijn exact-head Required/Brain/CodeQL, beschermd merge, Netlify deploy exact main en echte geauthenticeerde admin-readback plus 401/403 non-admincontrole.

## Bevestigingsgrens
Portaalcode/test in een PR is niet direct live. Pas na de externe Netlify-providerslag kan de nieuwe helptekst als productie worden gerapporteerd. De publicatie blijft PUBLISHED zonder onafhankelijk bewijs; menselijke toestemming of werkelijk beschikbaar providerbewijs kan niet technisch worden verzonnen. BRAIN fingerprint `linkedin|portal|personal-provider-created-readback-403-ambiguous|20261029-v1` blijft OBSERVED totdat echte adminbrowser-verificatie en een gecontroleerde regressie hebben plaatsgevonden.
