# Delivery ledger — authenticated portal Q&A route to selected model

**Obligation-ID:** portal-selected-model-question-answer-20261015

## Probleem
De klant had één standaardmodel kunnen kiezen, maar de vraagfunctie beschikte niet over een overeenkomstige AI-provideradapter. Door eerdere veiligheidsmaatregelen werd de oude vaste Anthropic-route bewust geblokkeerd.

## Geïmplementeerde controles
- `platform/api/tenant-ai-inference-handler.mjs`: optionele, server-only `trustedServerContext` met maximum 9000 tekens; de openbare requestacceptatie blijft alleen `question` toestaan.
- `netlify/functions/tenant-ai-inference.mjs`: interne server-side `runSelectedPortalAnswer`, identiteitsmatch met tenant, exact dezelfde geattesteerde runtime.
- `platform/api/portal-question-handler.mjs`: routeert opgeslagen klantmodelkeuze via signed provider; krijgt de bronprojectie uitsluitend via tenantgetrouwe `store.get`; weigert providerfall-back.
- `netlify/functions/portaalvraag.mjs`: sluit de beveiligde adapter aan op de bestaande UI.
- `portal-v2/ask-portal.js`: legt ontbrekende runtimeautorisatie zonder valse succesclaim aan de klant uit.
- Regressietests bewaken tenantisolatie, statuscode, geen bypass en geen uitgaand providerverkeer bij foutieve clientcontext.

## Acceptatiestatus
Bij aanmaak nog niet geproduceerd of geauthenticeerd getest tegen een echte tenantprovider. Required CI, CodeQL, merge en Netlify-live-SHA moeten afzonderlijk groen zijn. De tenant-runtime-registratie en signing key mogen niet synthetisch worden gegenereerd zonder onafhankelijke klantauthorisatie.
