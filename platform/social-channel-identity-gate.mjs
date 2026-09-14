import fs from 'node:fs';
import crypto from 'node:crypto';
const contract=JSON.parse(fs.readFileSync(new URL('../config/social-channel-identity-contract.json',import.meta.url),'utf8'));
export const CHANNEL_IDENTITY_CONTRACT_ID=contract.contractId;
export const CHANNELS=Object.freeze(contract.channels);
const PERSONAL=/\b(ik|mijn|mij|voor mij|bij mij|thuis|vandaag|gisteren|weekend|vakantie|hockey|tuin|auto|printer|robotstofzuiger)\b/i;
const BUSINESS=/\b(bedrijfsgeheugen|consultancy|consultant|klant|opdrachtgever|organisatie|organisaties|bedrijf|bedrijven|data|\bai\b|digitalisering|transformatie|propositie|dienstverlening|expertise|scan|offerte|lead|omzet|sales|framework|business)\b/i;
const CORPORATE=/\b(wij helpen|wij bieden|wij zorgen|onze klanten|onze aanpak|onze dienstverlening|onze expertise|neem contact op|vrijblijvend gesprek|ons aanbod)\b/i;
const MORAL=/\b(dit geldt ook voor organisaties|de les voor bedrijven|wat organisaties hiervan kunnen leren|in mijn werk zie ik|bij een klant|voor leiders|managementles)\b/i;
const has=v=>typeof v==='string'&&v.trim().length>0;
const refs=t=>Array.isArray(t?.evidenceRefs)?t.evidenceRefs.filter(has):[];
export function authorizeSocialPublication(input={}){
 const reasons=[],channel=CHANNELS[input.channelKind],text=String(input.text||'').trim();
 if(!channel) reasons.push('UNKNOWN_CHANNEL_KIND'); else if(input.channelId!==channel.channelId) reasons.push('CHANNEL_IDENTITY_MISMATCH');
 if(!text) reasons.push('EMPTY_CONTENT');
 if(contract.requiredLineage.some(k=>!has(input.lineage?.[k]))) reasons.push('LINEAGE_INCOMPLETE');
 if(input.channelKind==='linkedin_personal'){
  const exception=input.businessException;
  const exactException=exception?.explicitUserRequest===true&&has(exception?.contentId)&&exception.contentId===input.lineage?.contentId&&exception?.singleUse===true;
  if(!PERSONAL.test(text)) reasons.push('PERSONAL_LIFE_TOPIC_REQUIRED');
  if(BUSINESS.test(text)&&!exactException) reasons.push('BUSINESS_CONTENT_ON_PERSONAL');
  if(CORPORATE.test(text)) reasons.push('CORPORATE_VOICE_ON_PERSONAL');
  if(MORAL.test(text)) reasons.push('FORCED_BUSINESS_MORAL');
  if(input.companyPageInterchangeable!==false) reasons.push('COMPANY_PAGE_INTERCHANGEABLE_NOT_REJECTED');
  if(!contract.personalTruthClasses.includes(input.personalTruth?.class)) reasons.push('FIRST_PERSON_TRUTH_CLASS_REQUIRED');
  if(contract.personalTruthRequiresEvidenceRefs&&refs(input.personalTruth).length===0) reasons.push('FIRST_PERSON_EVIDENCE_REQUIRED');
  if(contract.personalTruthRequiresVerifiedFlag&&input.personalTruth?.verified!==true) reasons.push('FIRST_PERSON_TRUTH_UNVERIFIED');
  if(input.sensitivePrivateDetail===true&&input.explicitSensitiveApproval!==true) reasons.push('SENSITIVE_PRIVATE_DETAIL_BLOCKED');
 }
 if(input.channelKind==='instagram_company'){
  if(channel?.requiresMiraGate&&input.miraGatePassed!==true) reasons.push('MIRA_GATE_REQUIRED');
  const visual=input.instagramVisual,mediaKind=input.mediaKind||'image';
  if(visual?.verified!==true||refs(visual).length===0||!has(visual?.assetUrl)) reasons.push('INSTAGRAM_VISUAL_EVIDENCE_REQUIRED');
  if(visual?.placeholderDetected===true) reasons.push('INSTAGRAM_PLACEHOLDER_BLOCKED');
  if(visual?.identityClass!=='mira_daily_life') reasons.push('INSTAGRAM_MIRA_VISUAL_REQUIRED');
  if(has(input.assetUrl)&&has(visual?.assetUrl)&&visual.assetUrl!==input.assetUrl) reasons.push('INSTAGRAM_FINAL_ASSET_MISMATCH');
  if(mediaKind==='video'||mediaKind==='reel'){
   const required=channel?.mediaPolicy?.requiredVideoFramePositions||['start','middle','end'];
   const frames=Array.isArray(visual?.frameEvidence)?visual.frameEvidence:[];
   const complete=required.every(position=>frames.some(frame=>frame?.position===position&&frame?.verified===true&&refs(frame).length>0));
   if(!complete) reasons.push('INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED');
   if(frames.some(frame=>frame?.placeholderDetected===true)) reasons.push('INSTAGRAM_VIDEO_PLACEHOLDER_BLOCKED');
   if(frames.some(frame=>frame?.identityClass!=='mira_daily_life')) reasons.push('INSTAGRAM_MIRA_FRAME_IDENTITY_REQUIRED');
   if(visual?.formatVerified!==true) reasons.push('INSTAGRAM_MEDIA_FORMAT_UNVERIFIED');
   if(input.assetMimeType!=='video/mp4') reasons.push('INSTAGRAM_VIDEO_MP4_REQUIRED');
  }
 }
 const authorized=reasons.length===0;
 return {authorized,failClosed:contract.failClosed===true,contractId:contract.contractId,expectedChannelId:channel?.channelId||null,authorizationId:authorized?crypto.createHash('sha256').update([contract.contractId,input.channelKind,input.channelId,input.lineage.contentId,input.lineage.predictionId,text].join('|')).digest('hex'):null,reasons};
}
