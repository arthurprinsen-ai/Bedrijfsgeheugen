# Veilige koppeling klantmodel aan POWERHOUSE Bedrijfsbrein

**Status tijdens deze wijziging:** codekandidaat, niet automatisch productie.

## Implementatie
Klant kiest in het portaal modellen uit de 110 records en koppelt een model aan de taak **Bedrijfsbrein**. De bestaande `/api/tenant-ai-inference` controleert nu bij elke individuele vraag de portalstate voor de aangemelde tenant. De model-ID uit de catalogus, concrete API-ID, gekozen providerroute en afzonderlijk server-side ondertekende runtime-claim moeten exact overeenkomen.

De records met PARTIAL of CONFLICT bewijs, verouderde lifecycle, onbekende API-ID of ontbrekende modeltoewijzing worden afgewezen. Als de klant EER-opslag én verwerking wil, moet dit in de autoritatieve sovereignty-policy afgedwongen zijn. Bij strict soevereine infrastructuur blijft de gedeelde hosted route uitgeschakeld. De bestaande runtime controleert aanvullend bewijs van daadwerkelijke providerbeschikbaarheid, correcte regio, gevalideerde endpointidentiteit, privacy-/securitygoedkeuringen, toestemming, kostengoedkeuring en vervaldatum.

## Scopegrens
Deze runtimekoppeling is uitsluitend voor de bestaande `portal-project-answer`/Bedrijfsbrein-vraagfunctie. Document/OCR, embeddings en andere taaktoewijzingen zijn nog geen runtime-adapters; een wensenlijst activeert die niet. Het beschikbaar maken van de modelcatalogus blijft gescheiden van gebruik van gevoelige klantdata. Provideraccounts en contracten worden niet kunstmatig goedgekeurd.

## Acceptatie
Reproduceerbare regressietests moeten aantonen dat een blokkade géén uitgaand providerverzoek veroorzaakt; Required CI en CodeQL moeten succesvol zijn. Verifieer daarna een beschermde merge, exact productie-SHA en een niet-gesimuleerde, geauthenticeerde readback. Zonder bewijs van een werkelijke geautoriseerde klant- en providerconnectie mag geen werkende AI-executie worden geclaimd.

## Gebruikersroute voor gecontroleerde modeltest
In **AI-modellen kiezen & datasoevereiniteit** kan een ingelogde klant na het bewaren van een Bedrijfsbrein-toewijzing vrijwillig een niet-vertrouwelijke vraag insturen. De browser post alleen `question` naar `/api/tenant-ai-inference`, niet de volledige portalstate of bedrijfsdocumenten. De bestaande gateway vult de tenantcontext en ondertekende providerroute uitsluitend server-side in. Een niet-geprovisioneerde provider of een niet-passende EU-eis geeft een blokkeringscode. **Er is uitdrukkelijk geen automatische fallback naar de oude Anthropic-vraagfunctie.** Een geslaagde modeltest kan kosten opleveren en bewijst op zichzelf niet dat andere portaalfuncties zijn gekoppeld.
