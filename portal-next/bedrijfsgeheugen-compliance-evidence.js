const evidence=(id,label,href,detail='')=>Object.freeze({id,label,verified:true,href,detail});
const repo='https://github.com/arthurprinsen-ai/Bedrijfsgeheugen';
const production='https://www.bedrijfsgeheugen.nl/portal-next/compliance.html';

export const BEDRIJFSGEHEUGEN_COMPLIANCE_EVIDENCE = Object.freeze({
  asOf:'2026-09-08T10:45:50Z',
  source:'Bedrijfsgeheugen repository, CI contracts and exact-SHA production readback',
  scopeDecisions:Object.freeze({EU_AI_ACT:'unknown',NIS2_CBW:'unknown',GDPR_DATA:'unknown'}),
  controls:Object.freeze({
    'AI-INVENTORY':Object.freeze({
      applicability:'applicable',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Bedrijfsgeheugen gebruikt AI-functionaliteit en heeft een AI Register/Trust-governance surface die in de portalcontracts wordt bewaakt.',
      nextAction:'Houd per AI-use-case provider/model, doel, data, eigenaar, rol en classificatie actueel en koppel wijzigingsbewijs.',
      evidence:Object.freeze([
        evidence('BG-AI-REGISTER','AI Register in Trust & Governance',`${repo}/blob/main/portal-next/portal-business-os-navigation.js`,'Portalcontract bewaakt AI Register, Agent Team en Access Center.'),
        evidence('BG-AI-GOVERNANCE','Evidence-driven AI governance registry',`${repo}/tree/main/tests`,'CI verifieert dat AI-controls evidence-driven zijn en governance/training zichtbaar blijft.')
      ])
    }),
    'AI-ROLE-RISK':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Governance- en risicocontrols bestaan, maar een complete evidence-backed rol/risicoclassificatie van iedere actuele AI-use-case is nog niet als één formeel scopebesluit geregistreerd.',
      evidence:Object.freeze([evidence('BG-AI-RISK-GOV','Governed AI context en risk policy',`${repo}/tree/main/tests`,'AI-context kan readable objects niet overschrijden; governance thresholds en evidence semantics zijn getest.')])
    }),
    'AI-LITERACY':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Training/governance-controls zijn zichtbaar in het Data & AI Passport, maar deelname, doelgroepdekking en periodieke herhaling zijn nog niet als volledig opleidingsdossier gekoppeld.',
      evidence:Object.freeze([evidence('BG-AI-TRAINING','Training- en governance-control zichtbaar',`${repo}/tree/main/tests`,'Portalcontract verifieert zichtbare training- en cross-border governance-controls.')])
    }),
    'AI-TRANSPARENCY':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Publieke AI Act/governance-uitleg en governed AI-functionaliteit bestaan; toepasselijke disclosure per individuele interactie/use-case moet nog als complete Article-50 matrix worden bewezen.',
      evidence:Object.freeze([
        evidence('BG-AI-ACT-PAGE','Publieke AI Act informatie','https://www.bedrijfsgeheugen.nl/ai-act','Publieke uitleg over AI Act.'),
        evidence('BG-AI-GOV-PAGE','Publieke AI governance informatie','https://www.bedrijfsgeheugen.nl/ai-governance','Publieke governance-uitleg.')
      ])
    }),
    'AI-HUMAN-OVERSIGHT':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Connector/AI-runtimes zijn fail-closed: review-required output, safe-test evidence en server-side activation voorkomen ongecontroleerde activatie. De formele oversight-matrix per AI-use-case blijft apart te bewijzen.',
      evidence:Object.freeze([
        evidence('BG-AI-FAIL-CLOSED','Fail-closed AI en connector activation',`${repo}/tree/main/tests`,'Client kan Active niet faken; activation vereist persisted passing evidence.'),
        evidence('BG-AI-REVIEW','Review-required beslissingen met evidence',`${repo}/tree/main/tests`,'Ambigue/low-confidence resultaten vereisen review vóór vervolgstap.')
      ])
    }),
    'CBW-SCOPE':Object.freeze({
      applicability:'applicable',implemented:false,verifiedAt:null,
      reason:'De technische NIS2/Cbw-alignment is zichtbaar, maar de formele juridische scopebeoordeling van Bedrijfsgeheugen zelf is nog niet als ondertekend evidence-item gekoppeld.',
      nextAction:'Leg de formele Cbw/NIS2 scopeanalyse vast: entiteit, sector/dienst, omvang, bijzondere aanwijzing, conclusie en reviewer.',
      evidence:Object.freeze([])
    }),
    'CBW-RISK-MGMT':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Risico, evidence, recovery obligations en fail-closed statussemantiek zijn technisch afgedwongen; wettelijke toepasselijkheid en compleet cyberrisicodossier blijven apart vast te stellen.',
      evidence:Object.freeze([
        evidence('BG-RISK-EVIDENCE','Evidence-first risk en outcome semantics',`${repo}/tree/main/tests`,'Success zonder execution evidence wordt niet verified; risks/recovery blijven zichtbaar.'),
        evidence('BG-RECOVERY','Recovery obligations bij blocked/paused states',`${repo}/tree/main/tests`,'Paused/disabled met recovery obligation wordt blocked en eerdere failure evidence blijft behouden.')
      ])
    }),
    'CBW-INCIDENT':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Technische foutclassificatie, gecontroleerde retry en recovery-obligations bestaan. Een volledig wettelijk incidentmeldproces met rollen/tijdslijnen/oefenbewijs is nog niet als één evidencepakket gekoppeld.',
      evidence:Object.freeze([evidence('BG-INCIDENT-RECOVERY','Incident- en recoverymechanisme',`${repo}/tree/main/tests`,'Transient failures krijgen maximaal gecontroleerde retry; failures creëren immutable evidence en recovery.')])
    }),
    'CBW-CONTINUITY':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Persistent state, last-known-good gedrag en recovery-contracten bestaan. RTO/RPO, back-uprestore en crisisoefening zijn nog niet als compleet continuïteitsbewijs gekoppeld.',
      evidence:Object.freeze([evidence('BG-LKG','Last-known-good en persistent state',`${repo}/tree/main/tests`,'Refresh/write failures behouden gecontroleerde state; ontbrekende persistent store faalt expliciet.')])
    }),
    'CBW-SUPPLY-CHAIN':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Provider readiness, capability-only status en secret-stripping zijn technisch ingericht. Compleet leveranciers/subprocessorregister, contractreview en exit-evidence zijn nog niet bewezen.',
      evidence:Object.freeze([
        evidence('BG-PROVIDER-READINESS','Provider readiness zonder secrets',`${repo}/tree/main/tests`,'Readiness rapporteert capability state zonder provider- of tenantsecrets.'),
        evidence('BG-SECRET-BOUNDARY','Secret stripping en server-side provider boundary',`${repo}/tree/main/tests`,'Clientcatalogus/providerstatus kan geen credentials of ongeverifieerde active-status publiceren.')
      ])
    }),
    'CBW-IAM':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Authenticatie, tenant-isolatie, server-derived tenant, permission boundaries en expliciete adminrechten zijn aantoonbaar in de runtime. Formele Cbw-scope blijft onbekend.',
      evidence:Object.freeze([
        evidence('BG-IAM-IDENTITY','Netlify Identity en authenticated API boundary',`${repo}/tree/main/tests`,'Unauthenticated requests worden geweigerd; tenant komt uitsluitend uit verified identity/server membership.'),
        evidence('BG-IAM-TENANT','Tenant isolation en fail-closed permissions',`${repo}/tree/main/tests`,'Andere tenants kunnen elkaars connector/data niet lezen; permissions fail closed.'),
        evidence('BG-IAM-ACCESS','Access Center en expliciete admin permission',`${repo}/tree/main/tests`,'Trust workspace bevat Access Center; administrator heeft expliciete admin permission.')
      ])
    }),
    'DATA-PROCESSING':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Identity-scoped verwerking, bounded AI-context, provenance en authenticated data-gateways zijn aantoonbaar. Een volledig juridisch verwerkingsregister met grondslagen/bewaartermijnen is nog niet als compleet evidencepakket gekoppeld.',
      evidence:Object.freeze([
        evidence('BG-DATA-GATEWAY','Authenticated Supabase Edge data gateway',`${repo}/tree/main/tests`,'Reads/writes lopen via hardened authenticated gateway en stale-write semantics zijn getest.'),
        evidence('BG-DATA-PROVENANCE','Evidence provenance en confidence',`${repo}/tree/main/tests`,'Evidence exposeert provenance/confidence en browser kan canonical provenance niet claimen.')
      ])
    }),
    'DATA-LOCATION':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'EU-first opslag en migratiegedrag zijn getest; onbekende storage-region blijft bewust partial/unknown in plaats van groen. Daardoor is de feitelijke control zichtbaar zonder een onjuiste volledige residency-claim.',
      evidence:Object.freeze([
        evidence('BG-EU-FIRST','EU-first state storage',`${repo}/tree/main/tests`,'Reads EU first; nieuwe writes vallen niet terug naar de US store.'),
        evidence('BG-REGION-FAIL-CLOSED','Onbekende storage region blijft partial',`${repo}/tree/main/tests`,'Runtime evidence rapporteert echte configured regions; unknown region wordt niet groen gemaakt.')
      ])
    }),
    'DATA-SUBPROCESSORS':Object.freeze({
      applicability:'unknown',implemented:true,verifiedAt:'2026-09-08T10:45:50Z',
      reason:'Technische providerregistries en capability boundaries zijn aanwezig, maar een compleet actueel subprocessorregister inclusief doel, data, regio, DPA en reviewdatum is nog niet als bewijs gekoppeld.',
      evidence:Object.freeze([evidence('BG-PROVIDER-REGISTRY','Provider/capability registries zonder credentials',`${repo}/tree/main/tests`,'Adapterregistries publiceren capabilitymetadata zonder credentials.')])
    })
  }),
  production:Object.freeze({
    mergeSha:'20c4cf0125f4114e216be368e5480e135ea40e6c',
    route:production,
    evidence:Object.freeze([
      evidence('BG-REQUIRED','Required test exact-head green',`${repo}/actions`,'Branch protection aggregate is evidence-gated.'),
      evidence('BG-PROD-READBACK','Exact-SHA Netlify production readback',`${repo}/actions/runs/34216871275`,'Exact production commit, public visibility en UI visual regression completed successfully.')
    ])
  })
});

export function mergeBedrijfsgeheugenComplianceEvidence(runtime={}){
  const base=BEDRIJFSGEHEUGEN_COMPLIANCE_EVIDENCE;
  return {
    ...base,
    ...runtime,
    scopeDecisions:{...base.scopeDecisions,...(runtime.scopeDecisions||{})},
    controls:{...base.controls,...(runtime.controls||{})},
    production:{...base.production,...(runtime.production||{})}
  };
}
