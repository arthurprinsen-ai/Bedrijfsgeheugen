// Safe, deterministic human-work projection from the one canonical impact assessment.
// This is NOT evidence of finished legal, privacy, security, environmental or financial review.
const REVIEW_DOMAINS=Object.freeze({
  privacy:['Privacy en persoonsgegevens','Controleer grondslagen, persoonsgegevens, doorgifte en verwerkersafspraken'],
  security:['Informatiebeveiliging','Verifieer toegang, versleuteling, logging en technische risico’s'],
  ai_governance:['AI-governance','Controleer modelrisico, menselijke controle, contracten en AI-beleid'],
  data_residency:['Datalocatie','Verifieer opslag, verwerking, back-ups en netwerkroute met providerbewijs'],
  supplier_risk:['Leveranciers','Controleer contracten, subverwerkers, herkomst en afhankelijkheden'],
  finance:['Kosten en rendement','Meet integratiekosten, gebruikstarieven en verwachte bedrijfswaarde'],
  sustainability:['Duurzaamheid','Verzamel werkelijk energie- en milieubewijs zonder schattingen als feiten te presenteren'],
  csrd_esrs_scope:['CSRD/ESRS-toepasselijkheid','Beoordeel rapportageplicht en materiële onderwerpen; geen automatische juridische conclusie'],
  audit:['Audit en bewijs','Leg bron, reviewer, tijdstip en controlebewijs vast'],
  customer_disclosure:['Transparantie naar klant','Controleer welke informatie aan de betrokken organisatie moet worden getoond']
});
const ORDER=Object.keys(REVIEW_DOMAINS);
export function buildCrossDomainReviewPortfolio(impact,{tenantId}={}){
  if(impact==null)return Object.freeze({contract:'powerhouse-review-portfolio-v1',status:'NO_REVIEW',tasks:[]});
  if(!impact||impact.contract!=='powerhouse-cross-domain-change-v1'||!tenantId||impact.tenantId!==tenantId)
    throw Object.assign(new Error('CROSS_DOMAIN_TENANT_MISMATCH'),{code:'CROSS_DOMAIN_TENANT_MISMATCH'});
  if(impact.status!=='REVIEW_REQUIRED'||impact.changed!==true)
    return Object.freeze({contract:'powerhouse-review-portfolio-v1',status:'NO_REVIEW',tasks:[]});
  const domains=new Set(Array.isArray(impact.affectedDomains)?impact.affectedDomains:[]);
  const candidateEsrs=Array.isArray(impact.esrsReview)?[...new Set(impact.esrsReview
    .filter(x=>x?.reviewRequired===true&&x?.applicability==='UNDETERMINED'&&x?.materiality==='UNDETERMINED')
    .map(x=>String(x.standard||'').trim()).filter(x=>/^ESRS_[A-Z][0-9]$/.test(x)))].sort():[];
  const tasks=ORDER.filter(key=>domains.has(key)).map(key=>Object.freeze({
    domain:key,label:REVIEW_DOMAINS[key][0],requiredReview:REVIEW_DOMAINS[key][1],
    status:'NEEDS_EVIDENCE',evidenceVerified:false,
    ...(key==='csrd_esrs_scope'?{candidateEsrs,applicability:'UNDETERMINED',materiality:'UNDETERMINED',measuredEmissions:null}:{})
  }));
  return Object.freeze({contract:'powerhouse-review-portfolio-v1',status:tasks.length?'REVIEW_REQUIRED':'NO_REVIEW',
    changeKind:['AI_MODEL','AI_DEPLOYMENT','DATA_LOCATION','CONNECTOR','SUPPLIER'].includes(impact.kind)?impact.kind:'OTHER',
    tasks:Object.freeze(tasks)});
}
