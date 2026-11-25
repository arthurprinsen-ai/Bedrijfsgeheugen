# Vraag het je portaal: geselecteerd AI-model met servergebonden bedrijfscontext

Datum: 15 oktober 2026. Feature kandidaat totdat Required CI, CodeQL, beschermde merge en productie-readback bevestigd zijn.

Een ingelogde klant die een eigen standaard- of Bedrijfsbrein-model heeft gekozen, gebruikt in `/api/portaalvraag` niet langer de vaste legacy-Anthropic-route. De vraaghandler leest de geauthenticeerde tenantprojectie van de server, beperkt de meegestuurde inhoud tot 9000 tekens en roept in dezelfde Netlify servercontext `runSelectedPortalAnswer` aan. Die gebruikt **de bestaande** `handleTenantAiInference`, de geselecteerde model-/providerroute, ondertekende tenant-runtimebewijs, goedgekeurde privacy- en kosten-scopes en de effectieve EER-verwerkingsregels. De klantrequest mag uitsluitend de vraag bevatten; door de client meegegeven `context`, `tenant` of `provider` worden niet als bron of autorisatie gebruikt.

Het gecertificeerde runtime-usecase is `portal-project-answer`; alleen die proof mag een tenantgebonden contextvraag doen. De systeeminstructie behandelt de context als onbetrouwbare brondata, niet als programmeerinstructies, en verbiedt verzonnen forecasts of autonome acties. Het portaal ontvangt provider- en modelidentiteit en bewijsstatus, niet provider-API-credentials.

Als de leverancier, providerroute, signed proof, regionale verwerking of contractacceptatie ontbreekt, antwoordt de nieuwe vraagroute met een expliciete 409/503 en **geen fallback** naar Anthropic. Voor tenants zonder eigen modelkeuze blijft de legacy-implementatie onveranderd.

Deze wijziging activeert geen ontbrekende providercredentials, wijzigt geen kernberekeningen en maakt OCR/embeddings of financiële modellen niet automatisch actief. Claims over live klantgebruik vereisen een werkelijk geautoriseerde tenant- en providerreadback, apart van de software-release.
