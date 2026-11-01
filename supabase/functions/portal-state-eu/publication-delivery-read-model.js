/** Existing portal/control-plane: read-only projection of the ORIGINAL daily
 * content_publication_obligations (not a scheduler, writer or approval grant).
 * Generated content and GitHub workflow success are never provider publication.
 */
export const DAILY_DELIVERY_CONTRACT='powerhouse-original-publication-delivery-truth-v1';
const channels=['linkedin_personal','linkedin_company','blog','instagram'];
const owner={
 linkedin_personal:'powerhouse-content-orchestrator / powerhouse-social-publisher',
 linkedin_company:'powerhouse-content-orchestrator / powerhouse-social-publisher',
 blog:'CMS-redactie / powerhouse-blog-queue / oorspronkelijke GitHub-publisher',
 instagram:'powerhouse-instagram-media-router / powerhouse-social-publisher'
};
const str=value=>typeof value==='string'?value.trim():'';
export function summarizeDailyPublicationTruth(rows,runDate){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(str(runDate)))
   return {contract:DAILY_DELIVERY_CONTRACT,runDate:null,sourceState:'INVALID_DATE',expected:4,providerAcknowledged:0,independentlyProven:0,healthy:false,channels:[]};
 const byChannel=new Map();
 for(const row of Array.isArray(rows)?rows:[]){
  if(channels.includes(row?.channel)&&!byChannel.has(row.channel))byChannel.set(row.channel,row);
 }
 const items=channels.map(channel=>{
  const row=byChannel.get(channel);
  const state=str(row?.status).toUpperCase()||'NOT_OBSERVED',
   providerId=str(row?.external_id), approved=!!row?.approved_at,
   independent=!!row?.live_proven_at&&!!providerId;
  let proofState='PROOF_MISSING',next='Bron en oorspronkelijk kanaalbewijs ontbreken. Onderzoek origineel ONE BRAIN-incident.';
  if(independent){proofState='LIVE_PROVEN';next='Geen nieuwe verzending. Alleen monitoren, CRO en natuurlijke regressie.';}
  else if(providerId){proofState='PROVIDER_ACK_ONLY';next='Onafhankelijke readback ontbreekt; behoud provider-ID en verbied opnieuw publiceren.';}
  else if(channel==='blog'&&!approved){proofState='CMS_APPROVAL_REQUIRED';next='Gecontroleerde blog wacht op afzonderlijke bevoegde redactionele goedkeuring; daarna alleen bestaande beschermde GitHub/Netlify-publisher.';}
  else if(channel==='blog'){proofState='APPROVED_DELIVERY_PENDING';next='Alleen oorspronkelijke GitHub-blog-publisher mag publiceren; daarna exacte Netlify-URL onafhankelijk controleren.';}
  else if(channel==='linkedin_company'||channel==='linkedin_personal'){proofState='ORIGINAL_STORY_RECOVERY_DUE';next='Originele bronagent selecteert een wezenlijk nieuw verhaal vóór generatie; duplicate/authority-gate behouden.';}
  else if(channel==='instagram'){proofState='MIRA_MEDIA_PROOF_REQUIRED';next='Originele media-router eist 1080×1920, frame-identiteit ≥0,940 en echte Meta-provider-ID.';}
  // Never leak internal provider artifacts; a post link is only displayable
  // after the ORIGINAL provider acknowledges an exact, immutable ID.
  const recordedUrl=providerId?str(row?.canonical_url):'';
  const publicUrl=providerId && /^https:\/\/[^\s]*$/i.test(recordedUrl)?recordedUrl:null;
  return Object.freeze({
   channel,sourceStatus:state,proofState,
   providerAcknowledged:!!providerId,independentlyProven:independent,
   cmsApproved:channel==='blog'?approved:null,
   providerId:providerId||null,publicUrl,
   originalOwner:owner[channel],nextAction:next,
   sourceError:str(row?.last_error)||null
  });
 });
 const providerAcknowledged=items.filter(x=>x.providerAcknowledged).length,
   independentlyProven=items.filter(x=>x.independentlyProven).length;
 return Object.freeze({
  contract:DAILY_DELIVERY_CONTRACT,runDate,sourceState:Array.isArray(rows)?'CANONICAL_PROVIDER_OBLIGATIONS':'SOURCE_UNAVAILABLE',
  expected:4,providerAcknowledged,independentlyProven,
  healthy:independentlyProven===4,channels:items,
  independentTruthRequired:true,
  noAutomaticApproval:true,
  evidenceBoundary:'CMS/editorial approval, provider acknowledgement and independent live readback are different evidentiary milestones.'
 });
}
