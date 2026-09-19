import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANNELS,CHANNEL_IDENTITY_CONTRACT_ID,authorizeSocialPublication} from '../platform/social-channel-identity-gate.mjs';
const lineage={contentId:'personal-1',calendarDate:'2026-09-13',predictionId:'pred-1',sourceDecisionId:'decision-1'};
const truth={class:'author_observation',verified:true,evidenceRefs:['chat:verified-personal-fact']};
const run=(text,extra={})=>authorizeSocialPublication({channelKind:'linkedin_personal',channelId:CHANNELS.linkedin_personal.channelId,text,lineage,personalTruth:truth,companyPageInterchangeable:false,...extra});
test('V4 and exact channel identities are canonical',()=>{assert.equal(CHANNEL_IDENTITY_CONTRACT_ID,'arthur-personal-linkedin-identity-v4');assert.equal(CHANNELS.linkedin_personal.channelId,'6a70381699afb44349f0fb35');assert.equal(CHANNELS.linkedin_company.channelId,'6a70381699afb44349f0fb36');assert.equal(CHANNELS.instagram_company.channelId,'6a70384d99afb44349f0fba9')});
test('real harmless personal frustration passes',()=>assert.equal(run('Ik stond thuis vanochtend ruzie te maken met mijn printer. Volgens mij wint hij.').authorized,true));
test('a bare first-person wrapper is not a personal-life story',()=>{const r=run('Ik denk vandaag na over hoe je processen slimmer maakt.');assert.equal(r.authorized,false);assert.ok(r.reasons.includes('CONCRETE_PERSONAL_LIFE_EVENT_REQUIRED')||r.reasons.includes('CONSULTANT_VOICE_ON_PERSONAL'))});
test('weekend wrapper around leadership content is blocked',()=>{const r=run('Mijn weekendgedachte: leiderschap gaat over strategie concreet maken.');assert.equal(r.authorized,false);assert.ok(r.reasons.includes('BUSINESS_CONTENT_ON_PERSONAL')||r.reasons.includes('CONSULTANT_VOICE_ON_PERSONAL'))});
for(const [name,text,reason] of [
 ['AI thought leadership','Ik merk dat AI organisaties helpt slimmer te werken.','BUSINESS_CONTENT_ON_PERSONAL'],
 ['consultancy with personal anchor','Ik zie in mijn werk dat consultancy en data organisaties vooruit helpen.','BUSINESS_CONTENT_ON_PERSONAL'],
 ['client story','Vandaag bij een klant zag ik hoe een bedrijf met data worstelt.','BUSINESS_CONTENT_ON_PERSONAL'],
 ['Bedrijfsgeheugen copy','Ik denk dat Bedrijfsgeheugen bedrijven goed kan helpen.','BUSINESS_CONTENT_ON_PERSONAL'],
 ['forced lesson','Ik stond thuis met de printer. Dit geldt ook voor organisaties.','FORCED_BUSINESS_MORAL']]) test(name+' is blocked',()=>{const r=run(text);assert.equal(r.authorized,false);assert.ok(r.reasons.includes(reason))});
test('company-page copy with ik inserted remains blocked',()=>{const r=run('Ik denk dat onze aanpak sterk is. Wij helpen organisaties met data en AI. Neem contact op.');assert.equal(r.authorized,false);assert.ok(r.reasons.includes('CORPORATE_VOICE_ON_PERSONAL'))});
test('wrong Buffer channel fails closed',()=>{const r=authorizeSocialPublication({channelKind:'linkedin_personal',channelId:CHANNELS.linkedin_company.channelId,text:'Ik heb thuis ruzie met mijn printer.',lineage,personalTruth:truth,companyPageInterchangeable:false});assert.equal(r.authorized,false);assert.ok(r.reasons.includes('CHANNEL_IDENTITY_MISMATCH'))});
test('unverified or invented first-person claim fails closed',()=>{const r=run('Ik stond thuis met mijn printer.',{personalTruth:{class:'author_experience',verified:false,evidenceRefs:[]}});assert.equal(r.authorized,false);assert.ok(r.reasons.includes('FIRST_PERSON_EVIDENCE_REQUIRED'));assert.ok(r.reasons.includes('FIRST_PERSON_TRUTH_UNVERIFIED'))});
test('sensitive private detail needs exact approval',()=>{const r=run('Ik had thuis een persoonlijk moment.',{sensitivePrivateDetail:true});assert.equal(r.authorized,false);assert.ok(r.reasons.includes('SENSITIVE_PRIVATE_DETAIL_BLOCKED'))});
test('business exception is narrow and exact-content only',()=>{const text='Ik vertel vandaag over mijn consultancy ervaring.';assert.equal(run(text).authorized,false);const ok=run(text,{businessException:{explicitUserRequest:true,contentId:'personal-1',singleUse:true}});assert.equal(ok.authorized,true);const wrong=run(text,{businessException:{explicitUserRequest:true,contentId:'other',singleUse:true}});assert.equal(wrong.authorized,false)});
test('missing prediction/content lineage blocks publication',()=>{const r=authorizeSocialPublication({channelKind:'linkedin_personal',channelId:CHANNELS.linkedin_personal.channelId,text:'Ik heb thuis ruzie met mijn printer.',lineage:{contentId:'x'},personalTruth:truth,companyPageInterchangeable:false});assert.equal(r.authorized,false);assert.ok(r.reasons.includes('LINEAGE_INCOMPLETE'))});
test('Mira cannot route to Arthur personal channel',()=>{const r=authorizeSocialPublication({channelKind:'instagram_company',channelId:CHANNELS.linkedin_personal.channelId,text:'Mira opent haar laptop.',miraGatePassed:true,contentPersona:'mira',contentClass:'mira_daily_life',lineage});assert.equal(r.authorized,false);assert.ok(r.reasons.includes('CHANNEL_IDENTITY_MISMATCH'))});

const instagram=(extra={})=>authorizeSocialPublication({
 channelKind:'instagram_company',channelId:CHANNELS.instagram_company.channelId,text:'Mira opent haar laptop.',lineage,
 miraGatePassed:true,contentPersona:'mira',contentClass:'mira_daily_life',mediaKind:'image',assetUrl:'https://cdn.example/final.jpg',assetMimeType:'image/jpeg',...extra
});

const validInstagramVisual={
 verified:true,miraPresent:true,genericBrandCreative:false,evidenceRefs:['vision:final-frame'],assetUrl:'https://cdn.example/final.jpg',placeholderDetected:false,
 identityClass:'mira_daily_life',formatVerified:true,width:1080,height:1350,colorSpace:'RGB',hasAlpha:false,
 decodeComplete:true,visualComplete:true,grayOrEmptyDetected:false
};

test('Instagram cannot publish with Mira gate alone; final visual evidence is mandatory',()=>{
 const r=instagram();
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_VISUAL_EVIDENCE_REQUIRED'));
});

test('Instagram blocks a detected placeholder or broken render',()=>{
 const r=instagram({instagramVisual:{...validInstagramVisual,placeholderDetected:true}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_PLACEHOLDER_BLOCKED'));
});

test('Instagram blocks visuals that do not match Mira daily-life identity',()=>{
 const r=instagram({instagramVisual:{...validInstagramVisual,identityClass:'generic_corporate'}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_MIRA_VISUAL_REQUIRED'));
});

test('Instagram blocks when inspected asset is not the exact asset sent to Buffer',()=>{
 const r=instagram({instagramVisual:{...validInstagramVisual,assetUrl:'https://cdn.example/other.jpg'}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_FINAL_ASSET_MISMATCH'));
});

test('Instagram blocks generic Bedrijfsgeheugen creative even when technical media checks pass',()=>{
 const r=instagram({instagramVisual:{...validInstagramVisual,genericBrandCreative:true}});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_GENERIC_BRAND_CREATIVE_BLOCKED'));
});

test('Instagram blocks any non-Mira persona assignment',()=>{
 const r=instagram({contentPersona:'bedrijfsgeheugen',instagramVisual:validInstagramVisual});
 assert.equal(r.authorized,false);
 assert.ok(r.reasons.includes('INSTAGRAM_MIRA_PERSONA_REQUIRED'));
});

test('Instagram authorizes only the exact verified non-placeholder Mira final asset',()=>{
 const r=instagram({instagramVisual:validInstagramVisual});
 assert.equal(r.authorized,true);
});
