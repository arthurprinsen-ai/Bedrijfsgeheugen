import {buildOwnerOperatingModel} from './owner-operating-model.js';

export const ENTREPRENEUR_GOALS=Object.freeze([
  Object.freeze({id:'profit',label:'Meer winst',headline:'Meer verdienen aan het werk dat je al doet',reason:'Meet eerst je huidige winst en bepaal welke kosten en marges invloed hebben.',categories:['finance'],page:'cijfers-maatstaven'}),
  Object.freeze({id:'revenue_growth',label:'Meer omzet',headline:'Nieuwe omzet met gezonde marges',reason:'Breng je klanten, verkoopkansen en beschikbare capaciteit in beeld.',categories:['groei','klanten'],page:'sales-intelligence'}),
  Object.freeze({id:'automate',label:'Schalen met grip',headline:'Groeien zonder dat je organisatie vastloopt',reason:'Bekijk waar processen, mensen en capaciteit je groei beperken.',categories:['operatie'],page:'bedrijfssituatie'}),
  Object.freeze({id:'exit',label:'Verkopen of overdragen',headline:'Een onderneming die klaar is voor overdracht',reason:'Onderzoek kritieke afhankelijkheden, klanten, processen en overdraagbaarheid.',categories:['risico','strategie'],page:'exit'}),
  Object.freeze({id:'valuation',label:'Bedrijfswaarde verhogen',headline:'Je bedrijf structureel waardevoller maken',reason:'Bekijk winst, continuïteit en factoren die een koper moet kunnen toetsen.',categories:['finance','strategie'],page:'waarde-financiering'}),
  Object.freeze({id:'cash',label:'Meer financiële ruimte',headline:'Grip op geld en werkkapitaal',reason:'Breng inkomsten, uitgaven en liquiditeitsverloop in kaart.',categories:['finance'],page:'waarde-financiering'}),
  Object.freeze({id:'resilience',label:'Minder afhankelijkheid',headline:'Een bedrijf dat zelfstandig blijft draaien',reason:'Maak kennis, verantwoordelijkheden en risico’s inzichtelijk.',categories:['risico','operatie'],page:'mensen'})
]);

const BY_ID=Object.freeze(Object.fromEntries(ENTREPRENEUR_GOALS.map(goal=>[goal.id,goal])));
const unique=items=>[...new Set((Array.isArray(items)?items:[]).filter(id=>Boolean(BY_ID[id])))];
const hasValue=value=>value!==undefined&&value!==null&&value!==''&&Number.isFinite(Number(value));

export function goalContextPatch(current={},goalId,at=new Date().toISOString()){
  if(!BY_ID[goalId])throw new RangeError('ENTREPRENEUR_GOAL_INVALID');
  const goals=unique([...(Array.isArray(current.goals)?current.goals:[]),goalId]);
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
  const hasTarget=hasValue(target.target_value)&&typeof target.target_date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(target.target_date);
  const intelligence=authenticated?buildOwnerOperatingModel(safe,{now}):null;
  const recommended=chosen&&intelligence?.ready?intelligence.actions.find(item=>chosen.categories.includes(item.ownerCategory)&&item?.evidence_health?.status==='healthy'&&Array.isArray(item?.source_refs)&&item.source_refs.length>0):null;
  const next=!chosen
    ?{title:'Kies wat jij wilt bereiken',explanation:'Daarna stellen we één passende vervolgstap voor.',page:null,kind:'choose'}
    :!hasTarget
      ?{title:'Maak jouw doel concreet en meetbaar',explanation:chosen.reason,page:'bedrijfssituatie',kind:'measure'}
      :recommended
        ?{title:String(recommended.title||'Bekijk jouw onderbouwde voorstel'),explanation:String(recommended.explanation||recommended.summary||recommended.next_action||'Dit voorstel heeft actueel bronbewijs. Controleer de onderbouwing en eventuele vereiste goedkeuring.'),page:'actieve-acties',kind:'verified-proposal',requiresApproval:recommended.ownerSafety?.level==='goedkeuring',evidenceCount:recommended.source_refs.length}
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
  if(current.primary_goal===goalId&&Array.isArray(current.goals)&&current.goals.includes(goalId))return Object.freeze({saved:true,unchanged:true});
  domainState.patch('portal.business_context',patch);
  const ack=await domainState.flush();
  if(ack?.status!=='saved'||domainState.get('portal.business_context.primary_goal')!==goalId)
    throw new Error('ENTREPRENEUR_GOAL_CANONICAL_ACK_REQUIRED');
  return Object.freeze({saved:true,unchanged:false});
}
