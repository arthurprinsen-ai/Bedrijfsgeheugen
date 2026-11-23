const API_URL='/api/portal-project';
const clone=value=>value==null?value:structuredClone(value);
const array=value=>Array.isArray(value)?value:[];
const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
const first=(...values)=>values.find(value=>value!==undefined&&value!==null&&value!=='');

export function createPortalProjectClient({fetchImpl=globalThis.fetch,getToken=async()=>''}={}){
  return Object.freeze({
    apiUrl:API_URL,
    async load(){
      const token=await getToken();
      if(!token)throw new Error('AUTH_TOKEN_UNAVAILABLE');
      const response=await fetchImpl(API_URL,{method:'GET',headers:{accept:'application/json',authorization:`Bearer ${token}`},credentials:'same-origin'});
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(body?.error||`PORTAL_PROJECT_${response.status}`);
      return body;
    }
  });
}

function normalizeSprint(item,index){
  const row=object(item);
  return {
    ...clone(row),
    id:first(row.id,row.sprint_id,`sprint-${index+1}`),
    name:first(row.name,row.title,row.naam,`Sprint ${index+1}`),
    status:first(row.status,'Gepland'),
    stories:array(first(row.stories,row.userStories,row.user_stories)).map((story,storyIndex)=>normalizeStory(story,storyIndex))
  };
}
function normalizeStory(item,index){
  const row=object(item);
  return {...clone(row),id:first(row.id,row.story_id,`story-${index+1}`),title:first(row.title,row.name,row.titel,`User story ${index+1}`),status:first(row.status,'Te doen')};
}
function normalizeComponent(item,index){
  const row=object(item);
  const sprints=array(first(row.sprints,row.iterations,row.sprint));
  const stories=array(first(row.stories,row.userStories,row.user_stories));
  return {
    ...clone(row),
    id:first(row.id,row.key,`component-${index+1}`),
    title:first(row.title,row.name,row.naam,`Onderdeel ${index+1}`),
    description:first(row.description,row.omschrijving,row.scope,''),
    price:first(row.price,row.amount,row.bedrag,row.prijs,null),
    duration:first(row.duration,row.doorlooptijd,row.weeks,row.durationWeeks,null),
    optional:Boolean(first(row.optional,row.optioneel,false)),
    sprints:sprints.map(normalizeSprint),
    stories:stories.map(normalizeStory)
  };
}

export function projectRecordToPortalState(record={}){
  const customer=object(record.customer);
  const quote=object(record.quote);
  const inhoud=object(quote.inhoud);
  const components=array(first(inhoud.components,inhoud.onderdelen,inhoud.modules,quote.components)).map(normalizeComponent);
  const nestedSprints=components.flatMap(component=>component.sprints);
  const nestedStories=components.flatMap(component=>component.stories.concat(component.sprints.flatMap(sprint=>array(sprint.stories))));
  const roadmapItems=array(first(inhoud.roadmap,inhoud.planning,inhoud.timeline,inhoud.milestones)).map((item,index)=>{
    const row=object(item);return {...clone(row),id:first(row.id,`roadmap-${index+1}`),title:first(row.title,row.name,row.label,row.naam,`Mijlpaal ${index+1}`)};
  });
  const deliveryPlan=object(first(inhoud.deliveryPlan,inhoud.delivery,{}));
  return {
    company:{name:first(customer.name,customer.naam,'Klantproject'),naam:first(customer.name,customer.naam,'Klantproject')},
    portal:{
      project:{name:first(quote.title,inhoud.projectName,'Project'),phase:first(inhoud.phase,inhoud.fase,'Offerte'),status:first(quote.status,'Actueel'),budget:first(quote.bedrag,quote.amount,null),nextAction:first(inhoud.nextAction,inhoud.volgende_actie,'Bekijk offerte en planning')},
      offer:{
        number:first(quote.nummer,quote.number,''),title:first(quote.titel,quote.title,''),status:first(quote.status,''),amount:first(quote.bedrag,quote.amount,null),validUntil:first(quote.geldig_tot,quote.validUntil,null),
        package:first(inhoud.package,inhoud.pakket,inhoud.proposal,quote.titel,quote.title,'Projectvoorstel'),
        summary:first(inhoud.summary,inhoud.samenvatting,inhoud.intro,''),
        components,
        phases:array(first(inhoud.phases,inhoud.fasen)),
        terms:object(first(inhoud.terms,inhoud.voorwaarden,{})),
        subscriptions:array(first(inhoud.subscriptions,inhoud.abonnementen)),
        exclusions:array(first(inhoud.exclusions,inhoud.uitsluitingen)),
        raw:clone(inhoud)
      },
      delivery:{sprints:nestedSprints,tasks:array(first(inhoud.tasks,inhoud.taken)),openTasks:array(first(inhoud.tasks,inhoud.taken)).length,nextAction:first(inhoud.nextAction,inhoud.volgende_actie,'Bekijk offerte en planning')},
      deliveryPlan:{...clone(deliveryPlan),features:array(first(deliveryPlan.features,inhoud.features,components)),stories:array(first(deliveryPlan.stories,inhoud.stories,nestedStories))},
      roadmap:{items:roadmapItems},
      tasks:{items:array(first(inhoud.tasks,inhoud.taken))},
      documents:{items:array(first(inhoud.documents,inhoud.documenten))},
      integrations:{items:array(first(inhoud.integrations,inhoud.koppelingen))},
      notes:{items:array(first(inhoud.notes,inhoud.notities))},
      activity:array(first(inhoud.activity,inhoud.activiteit))
    }
  };
}

// Project API responses can omit collections. Omission is NOT permission to
// clear user-authored portal tasks, notes, documents, roadmap or integration data.
// Explicit [] is a genuine source-owned empty collection; preserve that intent.
const hasArray=(source,...keys)=>keys.some(key=>Array.isArray(source?.[key]));
const hasValue=(source,...keys)=>keys.some(key=>source?.[key]!==undefined&&source?.[key]!==null&&source?.[key]!=='');

export function mergeProjectState(base={},projectRecord={}){
 const record=object(projectRecord),customer=object(record.customer),quote=object(record.quote);
 const inhoud=object(quote.inhoud);
 const hasCustomerName=hasValue(customer,'name','naam');
 const hasQuote=Object.keys(quote).length>0;
 if(!hasCustomerName&&!hasQuote)return clone(base);
 const overlay=projectRecordToPortalState(record);
 const next=clone(base),portal={...object(next.portal)};
 if(hasQuote){
  const projected={...overlay.portal};
  const taskData=hasArray(inhoud,'tasks','taken');
  const componentData=hasArray(inhoud,'components','onderdelen','modules');
  const roadmapData=hasArray(inhoud,'roadmap','planning','timeline','milestones');
  if(!taskData)delete projected.tasks;
  if(!roadmapData)delete projected.roadmap;
  if(!hasArray(inhoud,'documents','documenten'))delete projected.documents;
  if(!hasArray(inhoud,'integrations','koppelingen'))delete projected.integrations;
  if(!hasArray(inhoud,'notes','notities'))delete projected.notes;
  if(!hasArray(inhoud,'activity','activiteit'))delete projected.activity;
  const delivery={};
  if(taskData){delivery.tasks=overlay.portal.delivery.tasks;delivery.openTasks=overlay.portal.delivery.openTasks;}
  if(componentData)delivery.sprints=overlay.portal.delivery.sprints;
  if(hasValue(inhoud,'nextAction','volgende_actie'))delivery.nextAction=overlay.portal.delivery.nextAction;
  if(Object.keys(delivery).length)projected.delivery={...object(portal.delivery),...delivery};
  else delete projected.delivery;
  if(!componentData&&!hasValue(inhoud,'deliveryPlan','delivery','features','stories'))
   delete projected.deliveryPlan;
  Object.assign(portal,projected);
 }
 return {
  ...next,
  company:hasCustomerName?{...object(next.company),...overlay.company}:object(next.company),
  portal
 };
}
