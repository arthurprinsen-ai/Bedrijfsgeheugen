import fs from 'node:fs';
import crypto from 'node:crypto';
const contract=JSON.parse(fs.readFileSync(new URL('../config/social-channel-identity-contract.json',import.meta.url),'utf8'));
export const CHANNEL_IDENTITY_CONTRACT_ID=contract.contractId;
export const CHANNELS=Object.freeze(contract.channels);
const FIRST_PERSON=/\b(ik|mijn|mij|me|voor mij|bij mij)\b/i;
const LIVED_CONTEXT=/\b(thuis|vanochtend|vanmorgen|vanmiddag|vanavond|vannacht|vandaag|gisteren|weekend|vakantie|hockey|wedstrijd|training|tuin|auto|fiets|trein|school|kind(?:eren)?|dochter|zoon|gezin|boodschappen|supermarkt|printer|telefoon|laptop|robotstofzuiger|file|regen|keuken|straat|buurt|verjaardag|restaurant|wandeling|sport)\b/i;
const LIVED_ACTION=/\b(stond|zat|liep|reed|ging|kwam|probeerde|vergat|wachtte|zocht|bracht|haalde|belde|sprak|keek|baalde|lachte|schrok|voelde|dacht ineens)\b/i;
const BUSINESS=/\b(bedrijfsgeheugen|consultancy|consultant|klant|opdrachtgever|organisatie|organisaties|bedrijf|bedrijven|data|\bai\b|digitalisering|transformatie|propositie|dienstverlening|expertise|scan|offerte|lead|omzet|sales|framework|business|strategie|management|directeur|eigenaar|mkb|prospect|dashboard)\b/i;
const CORPORATE=/\b(wij helpen|wij bieden|wij zorgen|onze klanten|onze aanpak|onze dienstverlening|onze expertise|neem contact op|vrijblijvend gesprek|ons aanbod)\b/i;
const MORAL=/\b(dit geldt ook voor organisaties|de les voor bedrijven|wat organisaties hiervan kunnen leren|in mijn werk zie ik|bij een klant|voor leiders|managementles|de les is|wat we hiervan kunnen leren|dit leert mij dat)\b/i;
const CONSULTANT=/\b(thought leadership|best practice|proces(?:sen)? slimmer|effici[eë]nter werken|waarde creëren|transformatie|governance|roadmap|stakeholder|executie|implementatie|optimaliseren|schaalbaar|future.?proof|leiderschap|strategie concreet maken)\b/i;
const PERSONAL_LIFE_ONLY_POLICY='personal-linkedin-personal-life-only-v1';
function hasConcretePersonalLife(text){
 return FIRST_PERSON.test(text)&&(
   (LIVED_CONTEXT.test(text)&&LIVED_ACTION.test(text))||
   /\bmijn\s+(kind|dochter|zoon|gezin|auto|fiets|tuin|telefoon|printer|weekend|vakantie|training|wedstrijd)\b/i.test(text)
 );
}
const has=v=>typeof v==='string'&&v.trim().length>0;
const refs=t=>Array.isArray(t?.evidenceRefs)?t.evidenceRefs.filter(has):[];
export function authorizeSocialPublication(input={}){
 const reasons=[],channel=CHANNELS[input.channelKind],text=String(input.text||'').trim();
 if(!channel) reasons.push('UNKNOWN_CHANNEL_KIND'); else if(input.channelId!==channel.channelId) reasons.push('CHANNEL_IDENTITY_MISMATCH');
 if(!text) reasons.push('EMPTY_CONTENT');
 if(contract.requiredLineage.some(k=>!has(input.lineage?.[k]))) reasons.push('LINEAGE_INCOMPLETE');
 if(input.channelKind==='linkedin_personal'){
  if(contract.personalLinkedInPolicyFingerprint!==PERSONAL_LIFE_ONLY_POLICY) reasons.push('PERSONAL_LIFE_ONLY_POLICY_UNAVAILABLE');
  if(input.personalLifeOnlyVerified!==true) reasons.push('PERSONAL_LIFE_ONLY_UNVERIFIED');
  if(!hasConcretePersonalLife(text)) reasons.push('CONCRETE_PERSONAL_LIFE_EVENT_REQUIRED');
  if(BUSINESS.test(text)) reasons.push('BUSINESS_CONTENT_ON_PERSONAL');
  if(CORPORATE.test(text)) reasons.push('CORPORATE_VOICE_ON_PERSONAL');
  if(MORAL.test(text)) reasons.push('FORCED_BUSINESS_MORAL');
  if(CONSULTANT.test(text)) reasons.push('CONSULTANT_VOICE_ON_PERSONAL');
  if(input.companyPageInterchangeable!==false) reasons.push('COMPANY_PAGE_INTERCHANGEABLE_NOT_REJECTED');
  if(!contract.personalTruthClasses.includes(input.personalTruth?.class)) reasons.push('FIRST_PERSON_TRUTH_CLASS_REQUIRED');
  if(contract.personalTruthRequiresEvidenceRefs&&refs(input.personalTruth).length===0) reasons.push('FIRST_PERSON_EVIDENCE_REQUIRED');
  if(contract.personalTruthRequiresVerifiedFlag&&input.personalTruth?.verified!==true) reasons.push('FIRST_PERSON_TRUTH_UNVERIFIED');
  if(input.sensitivePrivateDetail===true&&input.explicitSensitiveApproval!==true) reasons.push('SENSITIVE_PRIVATE_DETAIL_BLOCKED');
 }
 if(input.channelKind==='instagram_company'){
  if(channel?.requiresMiraGate&&input.miraGatePassed!==true) reasons.push('MIRA_GATE_REQUIRED');
  if(channel?.requiresContentPersona&&String(input.contentPersona||'').toLowerCase()!==String(channel.requiresContentPersona).toLowerCase()) reasons.push('INSTAGRAM_MIRA_PERSONA_REQUIRED');
  if(Array.isArray(channel?.allowedContentClasses)&&!channel.allowedContentClasses.includes(input.contentClass)) reasons.push('INSTAGRAM_MIRA_CONTENT_CLASS_REQUIRED');
  const visual=input.instagramVisual,mediaKind=input.mediaKind||'image',policy=channel?.mediaPolicy||{};
  if(Array.isArray(policy.allowedKinds)&&!policy.allowedKinds.includes(mediaKind)) reasons.push('INSTAGRAM_MEDIA_KIND_BLOCKED');
  if(channel?.requiresVisibleMira&&visual?.miraPresent!==true) reasons.push('INSTAGRAM_VISIBLE_MIRA_REQUIRED');
  if(channel?.blocksGenericBrandCreative&&visual?.genericBrandCreative!==false) reasons.push('INSTAGRAM_GENERIC_BRAND_CREATIVE_BLOCKED');
  if(channel?.requiresVisionSemanticProof&&(visual?.semanticVerified!==true||visual?.evidenceMethod!=='vision')) reasons.push('INSTAGRAM_VISION_SEMANTIC_PROOF_REQUIRED');
  if(channel?.requiresDailyLifeScene&&visual?.dailyLifeScene!==true) reasons.push('INSTAGRAM_DAILY_LIFE_SCENE_REQUIRED');
  if(channel?.requiresMiraCentralSubject&&visual?.miraCentralSubject!==true) reasons.push('INSTAGRAM_MIRA_CENTRAL_SUBJECT_REQUIRED');
  if(channel?.blocksTextDominantCreative&&visual?.textDominant!==false) reasons.push('INSTAGRAM_TEXT_DOMINANT_CREATIVE_BLOCKED');
  if(channel?.blocksBrandTemplateDominantCreative&&visual?.brandTemplateDominant!==false) reasons.push('INSTAGRAM_BRAND_TEMPLATE_DOMINANT_BLOCKED');
  if(visual?.verified!==true||refs(visual).length===0||!has(visual?.assetUrl)) reasons.push('INSTAGRAM_VISUAL_EVIDENCE_REQUIRED');
  if(visual?.placeholderDetected===true) reasons.push('INSTAGRAM_PLACEHOLDER_BLOCKED');
  if(visual?.identityClass!=='mira_daily_life') reasons.push('INSTAGRAM_MIRA_VISUAL_REQUIRED');
  if(has(input.assetUrl)&&has(visual?.assetUrl)&&visual.assetUrl!==input.assetUrl) reasons.push('INSTAGRAM_FINAL_ASSET_MISMATCH');
  if((policy.requiresVerifiedPublishFormatFor||[]).includes(mediaKind)&&visual?.formatVerified!==true) reasons.push('INSTAGRAM_MEDIA_FORMAT_UNVERIFIED');
  if(mediaKind==='image'){
   if(visual?.width!==policy.requiredImageWidth||visual?.height!==policy.requiredImageHeight) reasons.push('INSTAGRAM_IMAGE_DIMENSIONS_REQUIRED');
   if(input.assetMimeType!==policy.requiredImageMimeType) reasons.push('INSTAGRAM_IMAGE_JPEG_REQUIRED');
   if(visual?.colorSpace!==policy.requiredImageColorSpace) reasons.push('INSTAGRAM_IMAGE_RGB_REQUIRED');
   if(policy.requiresImageWithoutAlpha&&visual?.hasAlpha!==false) reasons.push('INSTAGRAM_IMAGE_ALPHA_BLOCKED');
   if(policy.requiresCompleteImageDecode&&visual?.decodeComplete!==true) reasons.push('INSTAGRAM_IMAGE_DECODE_INCOMPLETE');
   if(policy.requiresVisualCompleteness&&visual?.visualComplete!==true) reasons.push('INSTAGRAM_IMAGE_VISUAL_INCOMPLETE');
   if(policy.blocksGrayOrEmptyImage&&visual?.grayOrEmptyDetected!==false) reasons.push('INSTAGRAM_IMAGE_GRAY_OR_EMPTY_BLOCKED');
  }
  if(mediaKind==='video'||mediaKind==='reel'){
   const required=policy.requiredVideoFramePositions||['start','middle','end'];
   const frames=Array.isArray(visual?.frameEvidence)?visual.frameEvidence:[];
   const complete=required.every(position=>frames.some(frame=>frame?.position===position&&frame?.verified===true&&refs(frame).length>0));
   if(!complete) reasons.push('INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED');
   if(frames.some(frame=>frame?.placeholderDetected===true)) reasons.push('INSTAGRAM_VIDEO_PLACEHOLDER_BLOCKED');
   if(frames.some(frame=>frame?.identityClass!=='mira_daily_life')) reasons.push('INSTAGRAM_MIRA_FRAME_IDENTITY_REQUIRED');
   if(input.assetMimeType!==policy.requiredVideoMimeType) reasons.push('INSTAGRAM_VIDEO_MP4_REQUIRED');
  }
 }
 const authorized=reasons.length===0;
 return {authorized,failClosed:contract.failClosed===true,contractId:contract.contractId,expectedChannelId:channel?.channelId||null,authorizationId:authorized?crypto.createHash('sha256').update([contract.contractId,input.channelKind,input.channelId,input.lineage.contentId,input.lineage.predictionId,text].join('|')).digest('hex'):null,reasons};
}
