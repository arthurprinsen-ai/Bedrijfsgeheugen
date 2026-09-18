import { fieldMarkup, bindFields } from '../form-primitives.js';
import { calculateCompletion } from '../completion.js';
import { companyInputSchema } from './company-input.js';
import { functionalSchema } from './functional-suite.js';

const scalar=fields=>fields.filter(field=>field.type!=='repeatable');
const legacyPrefix=(fields,prefix)=>fields.filter(field=>String(field.legacyFieldId||'').startsWith(prefix));
const legacyIds=(fields,ids)=>{const wanted=new Set(ids);return fields.filter(field=>wanted.has(field.legacyFieldId));};

const metrics=()=>scalar(functionalSchema('cijfers-maatstaven'));
const finance=()=>scalar(functionalSchema('waarde-financiering'));
const people=()=>scalar(functionalSchema('mensen'));
const compliance=()=>scalar(functionalSchema('compliance-governance'));

export function fullCompanyInputGroups(){
 const metricFields=metrics();
 return [
  {id:'profile',label:'Profiel',fields:companyInputSchema('profiel')},
  {id:'financials',label:'Bedrijfscijfers',fields:legacyIds(metricFields,['cOmzet','cBrutomarge','cEbitda','cLoon','cKlanten','cGrootste','cMarketing','cNieuw','cDso','cIt'])},
  {id:'finance',label:'Balans en financiering',fields:finance()},
  {id:'people',label:'Mensen',fields:legacyIds(people(),['mVerzuim','mVerloop','mEnps','mMto','mVac'])},
  {id:'customers',label:'Klanten',fields:legacyIds(metricFields,['kNps','kTevreden','kHerhaal','kKlacht'])},
  {id:'productivity',label:'Productiviteit en operatie',fields:legacyPrefix(metricFields,'p')},
  {id:'measurements',label:'Metingen toevoegen',fields:legacyPrefix(metricFields,'mt')},
  {id:'sustainability',label:'Duurzaamheid en CSRD',fields:legacyPrefix(compliance(),'esgVelden:')},
  {id:'policy',label:'Beleid en documenten',fields:legacyPrefix(compliance(),'beleidLijst:')}
 ].map(group=>Object.freeze({...group,fields:Object.freeze([...group.fields])}));
}

export function fullCompanyInputSchema(){
 const byPath=new Map();
 for(const group of fullCompanyInputGroups())for(const field of group.fields)if(field?.path&&!byPath.has(field.path))byPath.set(field.path,field);
 return [...byPath.values()];
}

const valueAt=(state,path)=>String(path||'').split('.').filter(Boolean).reduce((value,key)=>value==null?undefined:value[key],state);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function completionMarkup(schema,state){
 const completion=calculateCompletion(schema,state);
 return `<div class="v2completion"><strong>${completion.percentage}% compleet</strong><span>${completion.complete} van ${completion.total} verplichte velden ingevuld</span></div>`;
}

function groupedForm(groups,state){
 const completion=calculateCompletion(fullCompanyInputSchema(),state);
 return `<section class="v2inputgroup"><header><h2>Je gegevens invullen</h2></header><p>Alles wat je hier invult rekent door in analyse, conclusie en advies. Ontbrekende gegevens blijven zichtbaar ontbrekend.</p></section>${completionMarkup(fullCompanyInputSchema(),state)}<div class="v2fullinput">${groups.map(group=>`<section class="v2inputgroup" data-input-group="${esc(group.id)}"><header><h3>${esc(group.label)}</h3><span>${group.fields.length} velden</span></header><div class="v2formgrid">${group.fields.map(field=>fieldMarkup(field,valueAt(state,field.path)??(field.type==='range'?2:''))).join('')}</div></section>`).join('')}</div><section class="v2inputgroup"><header><h3>Wat hieruit blijkt</h3></header><p>${completion.percentage}% van de verplichte bedrijfsgegevens is ingevuld. Wat ontbreekt wordt niet als feit gebruikt.</p></section><div class="v2formactions"><button type="button" class="pvprimary" data-save-full-input>Alles opslaan</button><span data-full-input-status>Wijzigingen worden tenant-scoped in dezelfde Powerhouse-state opgeslagen.</span></div>`;
}

function groupedReview(groups,state){
 return `<section class="v2inputgroup"><header><h2>Wat je hebt ingevuld</h2></header><p>Alle vastgelegde bedrijfsgegevens uit dezelfde tenant-state. Ontbrekende velden blijven expliciet leeg.</p></section><div class="v2fullinputreview">${groups.map(group=>`<section class="v2inputgroup" data-input-review-group="${esc(group.id)}"><header><h3>${esc(group.label)}</h3></header><div class="v2reviewlist">${group.fields.map(field=>{const value=valueAt(state,field.path);return `<article><div><small>${esc(field.legacyFieldId)}</small><b>${esc(field.label)}</b></div><strong>${value==null||value===''?'Nog niet ingevuld':esc(value)}</strong></article>`}).join('')}</div></section>`).join('')}</div>`;
}

export function mountFullCompanyInput(root,{domainState,reviewOnly=false,onSaveStatus}={}){
 if(!root?.querySelectorAll)throw new TypeError('FULL_COMPANY_INPUT_ROOT_REQUIRED');
 const groups=fullCompanyInputGroups(),schema=fullCompanyInputSchema();
 const renderReview=()=>{root.innerHTML=groupedReview(groups,domainState?.get?.()||{});};
 if(reviewOnly){renderReview();return Object.freeze({groups,schema,refresh:renderReview});}
 const render=()=>{
  const state=domainState?.get?.()||{};
  root.innerHTML=groupedForm(groups,state);
  const unbind=bindFields(root,schema,{onChange:(field,value)=>{
   domainState?.set?.(field.path,value);
   onSaveStatus?.(domainState?.status?.()||'dirty');
   const current=root.querySelector('.v2completion');if(current)current.outerHTML=completionMarkup(schema,domainState?.get?.()||{});
  }});
  const save=root.querySelector('[data-save-full-input]');
  save?.addEventListener('click',async()=>{
   const status=root.querySelector('[data-full-input-status]');
   try{onSaveStatus?.('saving');if(status)status.textContent='Opslaan…';await domainState?.flush?.();onSaveStatus?.('saved');if(status)status.textContent='Opgeslagen en server-bevestigd in Powerhouse.';}
   catch(error){onSaveStatus?.('error');if(status)status.textContent='Opslaan mislukt — geen serverbevestiging; wijzigingen worden niet als bewezen opgeslagen gemeld.';}
  });
  return unbind;
 };
 const destroy=render();
 return Object.freeze({groups,schema,destroy,refresh:render});
}
