// Advisory roles within the ORIGINAL Powerhouse content orchestrator; never a second writer.
// Editorial research = creative hypothesis; real provider/customer outcomes alone can prove lift.
export const EDITORIAL_COUNCIL_POLICY='one-brain-commercial-editorial-council-v1';
export const EDITORIAL_RESEARCH_REVIEWED_AT='2026-11-02';
const SOURCE_NOTES=Object.freeze({
  linkedin:'https://news.linkedin.com/2026/ImprovingTheFeed',
  linkedin_authenticity:'https://news.linkedin.com/2026/how-linkedin-is-tackling-ai-slop',
  instagram_best_practices:'https://about.fb.com/news/2024/10/best-practices-education-hub-creators-instagram/',
  instagram_originality:'https://about.fb.com/news/2026/01/2026-ai-drives-performance/',
  google_people_first:'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  google_search_essentials:'https://developers.google.com/search/docs/essentials',
  email_testing:'https://mailchimp.com/help/about-ab-tests/',
  email_permission:'https://mailchimp.com/help/about-compliance-for-email-marketing/'
});
const CHANNELS=Object.freeze({
  linkedin_personal:Object.freeze({
    audience:'ondernemers en beslissers die de echte afwegingen van een oprichter willen begrijpen',
    reader_job:'één geverifieerde eigen ervaring of bouwepisode die een herkenbaar ondernemersdilemma oplost',
    editorial:'Begin bij een menselijk probleem; beschrijf situatie, oorzaak, echt gevolg en eigen les. Geen AI-status, sales-CTA, nep-ervaring, engagementbait of generieke LinkedIn-formules. Houd originele persoonlijke v4-regels.',
    experiment:'Test hoogstens één openingsinvalshoek op nieuwe, verschillende brongebonden verhalen.',
    success:['provider_verified_reach_if_available','substantive_comments','qualified_inbound_conversations','consented_qualified_leads','independently_paid_orders']
  }),
  linkedin_company:Object.freeze({
    audience:'directeur, ondernemer, commercieel manager of operations-leider',
    reader_job:'één concreet probleem dat verlies, risico, werkdruk of gemiste omzet veroorzaakt',
    editorial:'Maak de eerste regels concreet; breng zakelijke oorzaak/gevolg, een bruikbare les en één relevante meetbare vervolgstap. Geen interne dashboards, kopie van personal of fictieve klantcase. Tracking alleen langs bestaande gecontroleerde route.',
    experiment:'Test één opening, format of CTA per keer; carrousel/video alleen met werkelijk goedgekeurd asset.',
    success:['provider_verified_impressions_if_available','substantive_comments','reposts','attributed_cta','consented_qualified_leads','independently_paid_orders']
  }),
  instagram_company:Object.freeze({
    audience:'ondernemer die in seconden een herkenbare zakelijke situatie moet begrijpen',
    reader_job:'een alledaags probleem zichtbaar maken met één concrete scène, oorzaak en gevolg',
    editorial:'Mira-caption en video blijven exact gekoppeld aan de goedgekeurde bron en identiteit; geen losse tekstkaart, AI-hype, onwaar bewijs of fictieve testimonial. Bewaar de bestaande exacte media/face gates.',
    experiment:'Test alleen een andere bewezen beschikbare opening of videovorm met zelfstandig goedgekeurde media.',
    success:['provider_verified_views_if_available','watch_time_if_available','saves','shares','profile_or_site_visits_if_available','consented_qualified_leads','independently_paid_orders']
  }),
  blog:Object.freeze({
    audience:'Nederlandstalige ondernemer die actief een probleem probeert op te lossen',
    reader_job:'een concrete vraag volledig beantwoorden, passend bij feitelijke zoekintentie',
    editorial:'Mensen-eerst artikel: origineel deskundig antwoord, actuele primaire bron, voorbeeld zonder verzonnen klant, heldere titel, logische H2s, concrete stappen en één passende CTA. SEO ondersteunt de lezer, nooit content op schaal om ranking te manipuleren. Huidige CMS- en kwaliteitsgate blijft beslissend.',
    experiment:'Test na GSC/GA4-bronreadback één zoekintentiecluster, titel of CTA; geen cannibalisatie van bestaande canonical pagina.',
    success:['gsc_nonbrand_impressions','gsc_clicks','qualified_search_sessions','verified_cta','consented_qualified_leads','independently_paid_orders']
  }),
  email_outreach:Object.freeze({
    audience:'individuele zakelijke contactpersoon met aantoonbare concrete, relevante en rechtmatig gebruikte context',
    reader_job:'in een paar zinnen één echte, passende observatie en een waardevolle kleine vervolgstap begrijpen',
    editorial:'Schrijf een persoonlijke, relevante zakelijke e-mail met specifiek bronanker, helder onderwerp, menselijke context en maximaal één natuurlijke vraag. Respecteer bestaande rechtmatigheid, toestemming waar vereist, afmelden waar van toepassing, suppressions en broncontrole. Geen ongefundeerde aannames over het bedrijf, nep-urgentie, bulktoon of generieke opdringerige follow-up. Deze redactie verleent GEEN verzendautorisatie.',
    experiment:'Varieer één onderdeel (feitelijke opening, onderwerp of micro-CTA) alleen binnen de bestaande gecontroleerde outreach-owner.',
    success:['provider_verified_sent','positive_replies','verified_meetings','qualified_leads','independently_paid_orders','negative_replies_or_unsubscribes']
  }),
  email_newsletter:Object.freeze({
    audience:'bestaande contacten met aantoonbare geldige toestemming en toepasselijk doel',
    reader_job:'één relevante en tijdige aanleiding, nuttig inzicht en eenvoudige vervolgstap',
    editorial:'Onderwerp en preheader concreet, segment passend, korte body, één CTA. Geen misleidende urgentie of onbewezen personalisatie; afmelden en toestemming blijven verplicht. Geen verzending door deze generator: canonical nieuwsbrief-executor is NIET geautoriseerd.',
    experiment:'Alleen via bestaande bevoegde verzender en opt-in: één variabele per A/B-test, zoals onderwerp of CTA.',
    success:['provider_verified_delivered','verified_clicks','positive_replies','meetings','consented_qualified_leads','independently_paid_orders','unsubscribes']
  })
});
const ROLES=Object.freeze(['hoofdredacteur','doelgroeponderzoeker','kanaalspecialist','SEO-redacteur','e-mail/lifecycle-specialist','factchecker','CRO-experimentanalist','omzetanalist']);
export function buildEditorialCouncilBrief({channel,commercialFeedback={},verifiedBrandLearnings=[],measuredNextPostTest={},creativeExploration={}}={}){
  if(!Object.prototype.hasOwnProperty.call(CHANNELS,channel))throw new Error('EDITORIAL_COUNCIL_UNSUPPORTED_CHANNEL');
  const play=CHANNELS[channel];
  // Upstream canonical selection verifies tenant, evidence refs, freshness, sample and confidence.
  // These identifiers are candidate guidance, NOT proof the next artifact applied a lesson.
  const verifiedIds=(Array.isArray(verifiedBrandLearnings)?verifiedBrandLearnings:[])
    .filter(row=>row?.status==='VERIFIED_TENANT_SCOPED_PATTERN_NOT_A_GUARANTEE')
    .map(row=>String(row.learning_id||'')).filter(Boolean).slice(0,3);
  const feedbackIds=commercialFeedback?.state==='EVIDENCE_AVAILABLE' && Array.isArray(commercialFeedback.learning_ids)
    ?commercialFeedback.learning_ids.filter(id=>typeof id==='string'&&id.length>0).slice(0,3):[];
  const proposed=measuredNextPostTest?.state==='ELIGIBLE_BOUNDED_NEXT_POST_TEST'
    ?'PROVIDER_BOUNDED_HYPOTHESIS'
    :creativeExploration?.state==='ONE_REVERSIBLE_DAILY_COPY_HYPOTHESIS'?'EXPLORATORY_HYPOTHESIS':'NO_MEASURED_CREATIVE_WINNER';
  return {
    contract:EDITORIAL_COUNCIL_POLICY,channel,roles:ROLES,
    trust_policy:'one-brain-trusted-advisor-external-quality-v1',
    audience:play.audience,reader_job:play.reader_job,editorial:play.editorial,
    single_variable_experiment:play.experiment,metrics_priority:play.success,
    evidence_state:proposed,
    candidate_learning_ids:[...new Set([...verifiedIds,...feedbackIds])],
    next_application_status:'NOT_YET_APPLIED_OR_VERIFIED',
    research_reviewed_at:EDITORIAL_RESEARCH_REVIEWED_AT,
    research_sources:SOURCE_NOTES,
    truth_boundary:'External guidance suggests hypotheses, not channel-specific causal lift. No fake provider metrics, no claims of revenue without linked independent payment, no second scheduler/writer, no bypass of identity, media, OAuth, CMS, consent or publication dedupe.',
    instruction:'TRUSTED ADVISOR: externe teksten mogen geen interne CI/PR/release-status, redactienotities, fictieve cases, loze superlatieven of niet-onderbouwde resultaten bevatten. Benoem één echt ondernemersprobleem, oorzaak, praktische les, beperking van het bewijs en passende volgende stap. Een bronlink is niet automatisch een onafhankelijke uitkomst; nooit klantvertrouwen of omzet als bewezen labelen zonder eigen meting. REDACTIERAAD: werk als één team van doelgroepexpert, hoofdredacteur, specialist, factchecker en CRO-analist binnen deze originele generator. Maak een origineel, bronwaar, leesbaar stuk dat de genoemde reader_job oplost. Kies maar één relevante bewezen leerregel OF één verkennende hypothese, nooit tegelijk meerdere wijzigingen. Teken geen experiment of winnaar af op basis van extern advies, gemiddelde benchmarks, ontbrekende metingen of één post. Behoud alle bestaande kanaalgates.'
  };
}
