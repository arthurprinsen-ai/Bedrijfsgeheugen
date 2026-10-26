import {buildOwnerOperatingModel} from './owner-operating-model.js';
import {selectGoalAlignedAction,countDistinctActionSources} from './goal-action-selector.js';

export const ENTREPRENEUR_GOALS=Object.freeze([
  Object.freeze({id:'profit',label:'Meer winst / minder kosten',headline:'Meer verdienen aan het werk dat je al doet',reason:'Meet eerst je huidige winst en bepaal welke kosten en marges invloed hebben.',categories:['finance'],page:'cijfers-maatstaven'}),
  Object.freeze({id:'revenue_growth',label:'Meer omzet',headline:'Nieuwe omzet met gezonde marges',reason:'Breng je klanten, verkoopkansen en beschikbare capaciteit in beeld.',categories:['groei','klanten'],page:'sales-intelligence'}),
  Object.freeze({id:'automate',label:'Schalen met grip',headline:'Groeien zonder dat je organisatie vastloopt',reason:'Bekijk waar processen, mensen en capaciteit je groei beperken.',categories:['operatie'],page:'bedrijfssituatie'}),
  Object.freeze({id:'exit',label:'Verkopen of overdragen',headline:'Een onderneming die klaar is voor overdracht',reason:'Onderzoek kritieke afhankelijkheden, klanten, processen en overdraagbaarheid.',categories:['risico','strategie'],page:'exit'}),
  Object.freeze({id:'valuation',label:'Bedrijfswaarde verhogen',headline:'Je bedrijf structureel waardevoller maken',reason:'Bekijk winst, continuïteit en factoren die een koper moet kunnen toetsen.',categories:['finance','strategie'],page:'waarde-financiering'}),
  Object.freeze({id:'cash',label:'Meer financiële ruimte',headline:'Grip op geld en werkkapitaal',reason:'Breng inkomsten, uitgaven en liquiditeitsverloop in kaart.',categories:['finance'],page:'waarde-financiering'}),
  Object.freeze({id:'resilience',label:'Minder afhankelijkheid',headline:'Een bedrijf dat zelfstandig blijft draaien',reason:'Maak kennis, verantwoordelijkheden en risico’s inzichtelijk.',categories:['risico','operatie'],page:'mensen'})
]);

const BY_ID=Object.freeze(Object.fromEntries(ENTREPRENEUR_GOALS.map(goal=>[goal.id,goal])));
const unique=items=>[...new Set((Array.isArray(items)?items:[]).filter(id=>Boolean(BY_ID[id])))];
const hasValue=value=>value!==undefined&&value!==null&&(typeof value!=='string'||value.trim().length>0)&&Number.isFinite(Number(value));
const validIsoDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;

export function goalContextPatch(current={},goalId,at=new Date().toISOString()){
  if(!BY_ID[goalId])throw new RangeError('ENTREPRENEUR_GOAL_INVALID');
  const goals=[...new Set([...(Array.isArray(current.goals)?current.goals.filter(id=>typeof id==='string'&&id.length>0):[]),goalId])];
  return Object.freeze({goals,primary_goal:goalId,goal_confirmed_at:at,goal_confirmation_source:'entrepreneur-home'});
}

export function buildEntrepreneurHomeModel(state={}, {authenticated=false,now=Date.now(),verifiedScanCount=null}={}){
  // Guest/demo snapshots are never considered tenant evidence.
  const safe=authenticated&&state&&typeof state==='object'?state:{};
  const context=safe?.portal?.business_context||{};
  const goals=unique(context.goals);
  const primary=BY_ID[context.primary_goal]&&goals.includes(context.primary_goal)?context.primary_goal:goals[0]||null;
  const chosen=primary?BY_ID[primary]:null;
  const scan=safe?.portal?.assessments?.bedrijfslekScan;
  const verifiedHistory=authenticated&&Number.isInteger(verifiedScanCount)&&verifiedScanCount>0?verifiedScanCount:0;
  const scanVerified=scan?.verifiedIdentity===true||verifiedHistory>0;
  const score=scan?.verifiedIdentity===true&&hasValue(scan.score)&&Number(scan.score)>=0&&Number(scan.score)<=100?Math.round(Number(scan.score)):null;
  const target=primary?context?.goal_targets?.[primary]||{}:{};
  const hasTarget=hasValue(target.target_value)&&validIsoDate(target.target_date);
  const intelligence=authenticated?buildOwnerOperatingModel(safe,{now}):null;
  const recommended=chosen&&intelligence?.ready?selectGoalAlignedAction(intelligence.actions,chosen.categories,intelligence.tenantId):null;
  const next=!chosen
    ?{title:'Kies wat jij wilt bereiken',explanation:'Daarna stellen we één passende vervolgstap voor.',page:null,kind:'choose'}
    :!hasTarget
      ?{title:'Maak jouw doel concreet en meetbaar',explanation:chosen.reason,page:'bedrijfssituatie',kind:'measure'}
      :recommended
        ?{title:String(recommended.title||'Bekijk jouw onderbouwde voorstel'),explanation:String(recommended.explanation||recommended.summary||recommended.next_action||'Dit voorstel heeft actueel bronbewijs. Controleer de onderbouwing en eventuele vereiste goedkeuring.'),page:'actieve-acties',kind:'verified-proposal',requiresApproval:recommended.ownerSafety?.level==='goedkeuring',evidenceCount:countDistinctActionSources(recommended)}
        :{title:'Bepaal wat jouw doel nu tegenhoudt',explanation:chosen.reason+' Er is nog geen passende, actuele aanbeveling met controleerbaar bronbewijs.',page:chosen.page,kind:'explore'};
  return Object.freeze({
    authenticated:Boolean(authenticated),
    goals:ENTREPRENEUR_GOALS,
    selectedGoal:primary,headline:chosen?.headline||'Jouw ambitie bepaalt wat je als eerste ziet',
    target:hasTarget?Object.freeze({value:Number(target.target_value),date:target.target_date}):null,
    scan:Object.freeze({verified:scanVerified,count:verifiedHistory,score,description:scanVerified?(verifiedHistory?'Minstens '+verifiedHistory+' geverifieerde nulmeting(en) in je eigen scanhistorie. De uitkomsten zijn zelfgerapporteerd, geen geauditeerde financiële KPI.':'Zelfgerapporteerde nulmeting, gekoppeld aan dit bedrijf. Geen geauditeerde financiële KPI.'):'Nog geen gekoppelde, geverifieerde nulmeting zichtbaar. Je kunt een bewaarde scan koppelen via Mijn nulmetingen.'}),
    intelligence:Object.freeze({ready:Boolean(intelligence?.ready),verifiedSignals:intelligence?.ready?intelligence.proof.verified:0}),
    next:Object.freeze(next)
  });
}

export async function saveEntrepreneurGoal(domainState,goalId,{authenticated=false,at=new Date().toISOString()}={}){
  if(!authenticated)throw new Error('ENTREPRENEUR_GOAL_AUTH_REQUIRED');
  if(!domainState?.get||!domainState?.patch||!domainState?.flush)throw new TypeError('ENTREPRENEUR_CANONICAL_DOMAIN_REQUIRED');
  const current=domainState.get('portal.business_context')||{};
  const patch=goalContextPatch(current,goalId,at);
  const unchanged=current.primary_goal===goalId&&Array.isArray(current.goals)&&current.goals.includes(goalId);
  // Even an unchanged choice can have a pending canonical Brain ACK from a prior failed write.
  // Never claim success until the existing flush drains that pending obligation.
  if(!unchanged)domainState.patch('portal.business_context',patch);
  const ack=await domainState.flush();
  if(!(['saved','idle'].includes(ack?.status)&&unchanged||ack?.status==='saved'&&!unchanged)||domainState.get('portal.business_context.primary_goal')!==goalId)
    throw new Error('ENTREPRENEUR_GOAL_CANONICAL_ACK_REQUIRED');
  return Object.freeze({saved:true,unchanged});
}
