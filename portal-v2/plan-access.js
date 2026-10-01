const ORDER=Object.freeze(['starter','pro','groei','enterprise']);
const PAGE_MIN_PLAN=Object.freeze({
  'overzicht':'starter',
  'profiel':'starter',
  'bedrijfssituatie':'starter',
  'documenten':'starter',
  'advies':'starter',
  'roadmap':'starter',
  'data-ai':'pro',
  'koppelingen':'pro',
  'brain-verwerking':'pro',
  'ai-capabilities':'pro',
  'taken-werkstromen':'pro',
  'businesscase':'pro',
  'due-diligence':'pro',
  'exit':'pro',
  'strategie-naar-maandagochtend':'pro',
  'actieve-acties':'pro',
  'agentstatus':'groei',
  'powerhouse-control-center':'groei',
  'outcomes-evidence':'groei',
  'learning-writeback':'groei',
  'os:impact-engine':'groei',
  'os:scenario-simulator':'groei',
  'os:next-best-actions':'groei',
  'os:monitoring-learning':'groei',
  'os:evidence-health':'groei',
  'os:capability-graph':'groei',
  'audit':'enterprise',
  'audittrail':'enterprise',
  'compliance-command-center':'enterprise',
  'recovery-obligations':'enterprise',
  'self-heal':'enterprise',
  'portfolio-control':'enterprise'
});

export function planRank(plan){return ORDER.indexOf(String(plan||'').toLowerCase())}
export function minPlanForPage(pageId){return PAGE_MIN_PLAN[pageId]||'starter'}
export function planAllowsPage(plan,pageId){
  const current=planRank(plan),required=planRank(minPlanForPage(pageId));
  return current>=0&&required>=0&&current>=required;
}
export function describePlanAccess(plan){
  const code=String(plan||'').toLowerCase();
  if(!ORDER.includes(code)) return null;
  return Object.freeze({
    code,
    rank:planRank(code),
    canUseAgents:planRank(code)>=planRank('pro'),
    canUseAutomation:planRank(code)>=planRank('groei'),
    canUseEnterpriseGovernance:code==='enterprise'
  });
}
export async function fetchPortalPlan(fetchFn=globalThis.fetch){
  const response=await fetchFn('/api/portal-entitlements',{headers:{accept:'application/json'}});
  if(!response.ok)return null;
  const payload=await response.json().catch(()=>null);
  if(!payload?.plan)return null;
  return Object.freeze({plan:String(payload.plan).toLowerCase(),planName:payload.plan_name||payload.plan,entitlements:payload.entitlements||{}});
}
export function applyPlanAccess(root=document,subscription){
  if(!subscription?.plan)return {locked:0,plan:null};
  const plan=subscription.plan;
  let locked=0;
  root.querySelectorAll('[data-page],[data-nav-target],[data-open-page]').forEach(node=>{
    const pageId=node.dataset.page||node.dataset.navTarget||node.dataset.openPage;
    if(!pageId||pageId.startsWith('hub:'))return;
    const allowed=planAllowsPage(plan,pageId);
    node.dataset.planAccess=allowed?'included':'upgrade';
    node.classList.toggle('plan-locked',!allowed);
    if(!allowed){
      locked++;
      node.setAttribute('aria-disabled','true');
      node.title=`Beschikbaar vanaf ${minPlanForPage(pageId)}`;
    }else{
      node.removeAttribute('aria-disabled');
      node.removeAttribute('title');
    }
  });
  document.documentElement.dataset.portalPlan=plan;
  return {locked,plan};
}
export {PAGE_MIN_PLAN};
