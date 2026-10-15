# POWERHOUSE: Mistral EU-regionale inferentie bewijsbaar afdwingen

**Status bij creatie:** releasekandidaat, niet als live beschouwen vóór CI, merge en productie-readback.

De modelcatalogus biedt `mistral-api-eu` als leverancierroute. Mistral maakt echter onderscheid tussen het wereldwijde endpoint `api.mistral.ai` (zonder specifieke regionale inferentiegarantie) en `api.eu.mistral.ai`. Een EU-datacenter voor opslag betekent evenmin dat alle inferentie, beheergegevens of subverwerkers uitsluitend binnen de EER blijven.

Voor klantaanvragen met EU Mistral vereist POWERHOUSE nu server-side `computeRegion=EU` in de actuele tenantpolicy én onafhankelijk getekend runtimebewijs. De Mistral-adapter adresseert uitsluitend `https://api.eu.mistral.ai/v1/chat/completions` wanneer de regionale route geldig is. De providerconfiguratie moet zowel `processingRegion=EU` als een geldig `residencyEvidenceId` bevatten dat met de ondertekende receipt overeenstemt. Ontbreekt dit, dan wordt uitvoering geweigerd in plaats van teruggevallen op de wereldwijde API.

De server-checklist voor activering rapporteert het ontbreken van de regiobewijzen als blokkade. Zelfs met alle regiovereisten blijven afzonderlijk de klanttoestemming, DPA/AVG, AI Act-rol-/risicobeoordeling, accountrechten, factureringsgoedkeuring en endpointcontrole nodig. De publieke catalogus betekent nooit runtime-eligibility. Ondertekeningssleutel en providerregister mogen niet uit de browser worden verkregen.

**Bron:** https://docs.mistral.ai/inference/regional-inference
