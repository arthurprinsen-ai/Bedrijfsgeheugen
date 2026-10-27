# Portal AI-modelkeuze, leveranciersevidence en soevereiniteit

PR #4380, 15 oktober 2026. POWERHOUSE gebruikt bestaande externe AI-modellen.

De nieuwe portaalpagina toont alle 110 catalogusrecords, met 83 geregistreerde leveranciersdossiers, 26 PARTIAL en 1 CONFLICT. De 26 behouden een onderzoeksstatus; Amazon Nova Premier blijft geblokkeerd wegens tegenstrijdige lifecycle-informatie. Ook een VERIFIED leveranciersdossier betekent niet dat een model voor een klant geactiveerd mag worden.

Klanten kunnen modelvoorkeuren en beoogde providerroute tenant-scoped opslaan; dit is uitdrukkelijk geen automatische uitvoering. De interface maakt onderscheid tussen dataopslag, verwerkingsregio, training, retentie, eigen hosting en providerjurisdictie. Een EER-datacenter is op zichzelf geen volledige datasoevereiniteit.

De EU AI Act wordt beoordeeld per toepassing en rol; het portaal vraagt om gebruiksdoel en voorlopige risico-inschatting, niet om een fictief modelcertificaat. Klant-specifieke DPA, toegangsrechten, regio-instelling en runtime-readback blijven noodzakelijk voor activering.

De release is pas afgerond na Required CI, CodeQL, beschermde merge, Netlify productie en bevestigde readback. In dit document worden die nog niet geclaimd.

Officiële bronnen: https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en en https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations en https://commission.europa.eu/news-and-media/news/sovereign-cloud-framework-explained-2026-06-01_en.
