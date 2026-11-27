// Business-specific human problem recognition in the ORIGINAL eight-call Mira radar.
// Do not convert a product launch into a client complaint merely because the
// announcement contains 'offertes' or 'software'. This classifies existing
// independent dated source text; it NEVER makes a source eligible by itself.
export const MIRA_BUSINESS_FRICTION_CONTRACT='mira-original-real-operational-friction-v1';

const direct=/(?:personeels?tekort|capaciteits?tekort|kennistekort|kennisverlies|factuurfout(?:en)?|foutieve factu(?:u)?r(?:en)?|onjuiste factu(?:u)?r(?:en)?|krappe marges?|onbetaalde? factur(?:en)?|achterstallige? betaling(?:en)?|betalingsachterstand|factur(?:en|atie)? (?:te )?laat|te laat betaald|niet betaald|openstaande? factur(?:en)?|offertes? (?:blijft|blijven|liggen|onbeantwoord|vergeten)|offertes? zonder opvolging|geen (?:reactie|opvolging) op (?:de )?offerte|dubbel(?:e)? invoer|dubbel overtypen|handmatig overtypen|fout(?:en)? in (?:excel|administratie|cijfers)|verschillende cijfers|uitlop(?:end|en|ende) (?:project|planning)|meerwerk(?:kosten)? (?:loopt|lopen|stijgt|stijgen)|marges? (?:onder druk|daalt|dalen|verdwijnt)|klanten? (?:haken af|vertrekken|verloren)|klantverlies|winst (?:daalt|dalen|blijft achter)|omzetverlies|teveel (?:werk|taken|handwerk)|belemmer(?:en|t|d)|stagn(?:eert|eren)|knelpunt(?:en)?|vertraging(?:en)?|loopt vast|lopen vast|stilgevallen|achterstand(?:en)?)/iu;
const legacy=/(?:klacht|erger|irrit|frustr|gedoe|lastig|waardeloos|probleem|werkt niet|kan niet|steeds|moet ik|waarom)/iu;
const launch=/(?:lanceert|introduceert|brengt .* op de markt|nieuwe (?:ai[- ]?assistent|software|tool|app|oplossing)|presenteert (?:software|platform|tool)|productlancering|kondigt .* aan)/iu;

export function classifyMiraBusinessFriction({title='',excerpt=''}={}){
 const t=String(title||''),body=String(excerpt||''),all=t+' '+body;
 // A vendor's product announcement is not evidence that the claimed problem
 // actually happened to an SME. Do not promote one to an original Mira source.
 if(launch.test(t))
  return Object.freeze({frictionScore:0.55,admissible:false,reason:'VENDOR_ANNOUNCEMENT_NOT_OBSERVED_OPERATIONAL_FRICTION',contract:MIRA_BUSINESS_FRICTION_CONTRACT});
 if(direct.test(all))
  return Object.freeze({frictionScore:1,admissible:true,reason:'CONCRETE_MKB_OPERATIONAL_FRICTION',contract:MIRA_BUSINESS_FRICTION_CONTRACT});
 return Object.freeze({frictionScore:legacy.test(all)?1:0.55,admissible:true,
   reason:legacy.test(all)?'DIRECT_HUMAN_FRUSTRATION':'NO_OBSERVED_MKB_FRICTION',contract:MIRA_BUSINESS_FRICTION_CONTRACT});
}
