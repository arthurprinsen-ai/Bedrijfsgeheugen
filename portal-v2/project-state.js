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

export function mergeProjectState(base={},projectRecord={}){
  const overlay=projectRecordToPortalState(projectRecord);
  return {
    ...clone(base),
    company:{...object(base.company),...overlay.company},
    portal:{...object(base.portal),...overlay.portal}
  };
}
