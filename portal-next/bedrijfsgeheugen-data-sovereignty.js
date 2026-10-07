const source=(label,href,kind='provider')=>Object.freeze({label,href,kind});

export const BEDRIJFSGEHEUGEN_DATA_SOVEREIGNTY = Object.freeze({
  asOf:'2026-10-07',
  scope:'Bedrijfsgeheugen zelf',
  principle:'Geen EU-hostingclaim op basis van een merknaam. Per schakel tonen we welke data de dienst raakt, waar opslag en verwerking aantoonbaar plaatsvinden, welke doorgifte mogelijk is en welk bewijs nog ontbreekt.',
  primaryFlow:Object.freeze([
    Object.freeze({from:'Gebruiker / browser',to:'Netlify',when:'Elke website- of portalrequest',data:'Request, sessie- en portalcontext die nodig is voor de gevraagde functie'}),
    Object.freeze({from:'Netlify',to:'Supabase',when:'Portaldata lezen of schrijven',data:'Tenantgebonden portalstate, governance- en evidencegegevens'}),
    Object.freeze({from:'Netlify',to:'Anthropic API',when:'Alleen bij een expliciete AI-vraag of vertaling',data:'Begrensde request-context; niet de volledige datastore'}),
    Object.freeze({from:'Supabase',to:'Notion',when:'Alleen voor geselecteerde projecties/synchronisaties',data:'Geselecteerde kennis- of beslisprojecties; Supabase blijft canonical source'}),
  ]),
  providers:Object.freeze([
    Object.freeze({
      id:'supabase',
      provider:'Supabase',
      role:'EU-primary datastore en portal-gateway',
      customerDataPath:'Ja — primaire opslag',
      data:'Portalstate, tenantdata, AI-governance, evidence en geselecteerde operationele records.',
      storage:'Aantoonbaar eu-central-1 (Frankfurt) voor het actuele Supabase-project. Postgres/Auth/Storage volgen de primaire projectregio.',
      processing:'Database/Auth/Storage zijn regionaal. Supabase Edge Functions zijn standaard wereldwijd gedistribueerd en draaien dicht bij de aanroeper, tenzij de regio expliciet wordt geforceerd.',
      retention:'Applicatieretentie is door Bedrijfsgeheugen te bepalen; providerback-ups, logs en platformretentie moeten afzonderlijk in het verwerkingsregister blijven staan.',
      training:'Niet van toepassing op de database-/platformdienst.',
      transfer:'Primaire opslag: EU. Edge Function-uitvoering is nog niet als EU-only bewezen.',
      status:'PARTIAL',
      statusLabel:'Opslag EU bewezen · processing nog deels open',
      nextAction:'Forceer en bewijs de portal-state Edge Function op eu-central-1 en leg back-up/log/subprocessor-retentie vast.',
      evidence:Object.freeze([
        source('Live Supabase projectreadback — eu-central-1','https://supabase.com/dashboard/projects','runtime'),
        source('Supabase — Available regions','https://supabase.com/docs/guides/platform/regions'),
        source('Supabase — Regional Edge Function invocations','https://supabase.com/docs/guides/functions/regional-invocation'),
        source('Supabase — Data Processing Addendum','https://supabase.com/legal/customer-resources/data-processing-addendum')
      ])
    }),
    Object.freeze({
      id:'netlify',
      provider:'Netlify',
      role:'Websitehosting, CDN, build en serverless runtime',
      customerDataPath:'Ja — transit/verwerking, niet canonical opslag',
      data:'HTTP-requests, portal-API payloads tijdens uitvoering, deploymentmetadata, runtime logs en secrets/configuratie.',
      storage:'De canonical portaldata staat niet in Netlify maar in Supabase. Statische assets worden via Netlify CDN geleverd; platformlogs/configuratie vallen onder Netlify.',
      processing:'Serverless Functions verwerken portalrequests. De actuele Functions-regio van Bedrijfsgeheugen is met de nu beschikbare repository/site-evidence niet bewezen en wordt daarom niet als EU geclaimd.',
      retention:'Platform-/logretentie en subprocessorretentie nog bewijsbaar vastleggen.',
      training:'Niet van toepassing op onze eigen serverless runtime. Netlify kan eigen subprocessors gebruiken voor platformfeatures; die staan los van onze directe Anthropic API-route.',
      transfer:'Niet als EU-only bewezen. Netlify ondersteunt o.a. Frankfurt en Dublin, maar een ondersteunde regio is geen bewijs dat deze site daar draait.',
      status:'UNVERIFIED',
      statusLabel:'Runtimeregio nog niet bewezen',
      nextAction:'Lees de live Functions-regio uit Cloud compute > Functions > Region, zet die zo nodig op fra/dub en leg een productie-readback vast.',
      evidence:Object.freeze([
        source('Bedrijfsgeheugen live Netlify site','https://app.netlify.com/projects/bedrijfsgeheugen','runtime'),
        source('Netlify — Functions configuration / regions','https://docs.netlify.com/build/functions/configuration/'),
        source('Netlify Trust Center','https://www.netlify.com/trust-center/')
      ])
    }),
    Object.freeze({
      id:'anthropic',
      provider:'Anthropic',
      role:'Productie-AI voor website/portal-Q&A, vertaling en connector guidance',
      customerDataPath:'Ja — alleen bij expliciete AI-functie',
      data:'De vraag plus begrensde request- of projectcontext die voor die AI-functie is toegestaan. De applicatie staat persistent provider memory niet toe.',
      storage:'Anthropic vermeldt voor de commerciële API standaard opslag in de Verenigde Staten, tenzij anders overeengekomen.',
      processing:'Anthropic verwerkt commerciële klantdata standaard in meerdere regio’s (VS, Europa, Azië en Australië). EU-only verwerking is voor onze directe API-route niet bewezen.',
      retention:'Anthropic API inputs/outputs worden standaard binnen 30 dagen verwijderd, behoudens andere overeenkomst, misbruikpreventie of wettelijke verplichting. Zero Data Retention is een aparte overeenkomst.',
      training:'Standaard niet gebruikt om Anthropic-modellen te trainen bij commerciële API-diensten, tenzij expliciet opt-in/feedback.',
      transfer:'Ja — verwerking buiten de EER is mogelijk en opslag is standaard VS. Dit is dus bewust geen EU-soevereine AI-route.',
      status:'CROSS_BORDER',
      statusLabel:'Cross-border · transparant beperkt',
      nextAction:'Beslis expliciet of de huidige directe API-route voor Confidential-data acceptabel is; voor strikte EU-only eisen: migreer de betreffende use-case naar een regionaal beheerde inference-route en bewijs die.',
      evidence:Object.freeze([
        source('Runtimecode — directe Anthropic API','https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/blob/main/netlify/functions/_brain-ai.mjs','runtime'),
        source('Anthropic — server-/processinglocaties','https://privacy.anthropic.com/en/articles/7996890-where-are-your-servers-located-do-you-host-your-models-on-eu-servers'),
        source('Anthropic — API-retentie','https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data'),
        source('Anthropic — modeltraining commerciële producten','https://privacy.anthropic.com/en/articles/7996868-is-my-data-used-for-model-training')
      ])
    }),
    Object.freeze({
      id:'notion',
      provider:'Notion',
      role:'Secundaire kennis-/beslisprojectie en operationele werklaag',
      customerDataPath:'Beperkt — alleen geselecteerde projecties',
      data:'Geselecteerde kennisrecords en beslisprojecties. De code markeert Supabase/BRAIN als source of truth voor bedrijfsbeslissingen.',
      storage:'De actuele workspace-residency van Bedrijfsgeheugen is nog niet technisch bewezen. Notion zegt dat data standaard in de VS blijft totdat een Enterprise data-residency migratie is bevestigd; EU-residency gebruikt Frankfurt met Ierland als back-upregio.',
      processing:'Ook met EU data residency kan Notion data via subprocessors en andere internationale locaties verwerken.',
      retention:'Afhankelijk van workspace-/productinstellingen; nog niet als Bedrijfsgeheugen-evidence vastgelegd.',
      training:'Notion AI is niet de productie-AI-route van Bedrijfsgeheugen. Eventuele Notion AI-verwerking moet als aparte capability worden geregistreerd als die wordt gebruikt.',
      transfer:'Mogelijk buiten de EER. Zonder workspacebewijs wordt geen EU-residency geclaimd.',
      status:'UNVERIFIED',
      statusLabel:'Workspace-residency nog niet bewezen',
      nextAction:'Leg plan, workspace data-residency status, DPA, subprocessors en retentie vast; tot die tijd Notion niet als EU-only presenteren.',
      evidence:Object.freeze([
        source('Bedrijfsgeheugen code — Notion projectie','https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/blob/main/brain/adapters/company-decision-notion.mjs','runtime'),
        source('Notion — Data residency','https://www.notion.com/nl/help/data-residency'),
        source('Notion — Privacy practices','https://www.notion.com/help/privacy')
      ])
    }),
    Object.freeze({
      id:'github',
      provider:'GitHub',
      role:'Broncode, CI/CD en technische evidence',
      customerDataPath:'Nee — by design geen portalinvoer',
      data:'Broncode, configuratie, pull requests, Actions-metadata en technische evidence. Klantinhoud en productie-secrets horen niet in de repository.',
      storage:'Deze repository staat op GitHub.com. GitHub documenteert dat GitHub.com-data standaard in de Verenigde Staten wordt opgeslagen.',
      processing:'CI/CD kan repositorycode en testdata verwerken. Productiecredentials horen uitsluitend via secrets/secured runtime boundaries beschikbaar te zijn.',
      retention:'Volgens GitHub-platform- en repositorybeleid; geen klantportaldata als bedoeld opslagdoel.',
      training:'Niet van toepassing op GitHub als broncodeplatform; AI-codefeatures moeten afzonderlijk worden geregistreerd wanneer gebruikt.',
      transfer:'GitHub.com is geen EU-dataresidencyroute. Dat is acceptabel voor publieke broncode/evidence, niet voor klantdata.',
      status:'NO_CUSTOMER_DATA',
      statusLabel:'Geen klantdatastore · GitHub.com VS',
      nextAction:'Blijf technisch afdwingen dat klantdata/secrets niet naar repo, Actions-artifacts of logs lekken. Alleen bij noodzaak voor private bedrijfsdata GHE.com data residency beoordelen.',
      evidence:Object.freeze([
        source('Bedrijfsgeheugen repository','https://github.com/arthurprinsen-ai/Bedrijfsgeheugen','runtime'),
        source('GitHub — data residency','https://docs.github.com/en/enterprise-cloud@latest/admin/data-residency/about-github-enterprise-cloud-with-data-residency')
      ])
    }),
    Object.freeze({
      id:'openai-chatgpt',
      provider:'OpenAI / ChatGPT',
      role:'Interne ontwikkel- en operationele assistent; niet de productie-AI van het portaal',
      customerDataPath:'Nee — niet automatisch; handmatig/agentgebruik is een afzonderlijke interne workflow',
      data:'Alleen informatie die een bevoegde gebruiker expliciet aan de interne assistent beschikbaar maakt. Productieportalrequests worden door de applicatie niet naar OpenAI gestuurd.',
      storage:'Werkspace-/productafhankelijk. Voor Bedrijfsgeheugen is de relevante ChatGPT-residencyconfiguratie nog niet als publiek compliancebewijs vastgelegd.',
      processing:'Werkspace-/productafhankelijk. OpenAI biedt voor in aanmerking komende zakelijke ChatGPT-omgevingen data- en inferentieresidency, maar beschikbaarheid is geen bewijs dat onze workspace zo staat.',
      retention:'Afhankelijk van gekozen ChatGPT-product, workspace en ingestelde controls; niet publiek als Bedrijfsgeheugen-control geclaimd.',
      training:'Afhankelijk van product/contract. Geen generieke “no training”-claim zonder bewijs van de gebruikte zakelijke workspace.',
      transfer:'Onbekend totdat workspace-instellingen en contract zijn vastgelegd.',
      status:'INTERNAL_ONLY',
      statusLabel:'Interne tool · buiten productie-datapad',
      nextAction:'Leg workspace-type, data-/inference-residency, retentie en trainingcontrols als interne evidence vast; verbied Confidential-klantdata zolang die controls niet aantoonbaar passend zijn.',
      evidence:Object.freeze([
        source('OpenAI — ChatGPT data & inference residency','https://help.openai.com/en/articles/9903489-data-residency-and-inference-residency-for-chatgpt'),
        source('Bedrijfsgeheugen runtime gebruikt Anthropic, niet OpenAI','https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/blob/main/netlify/functions/_brain-ai.mjs','runtime')
      ])
    })
  ])
});

export function getBedrijfsgeheugenSovereigntyProvider(id){
  return BEDRIJFSGEHEUGEN_DATA_SOVEREIGNTY.providers.find(item=>item.id===id)||null;
}
