const clean=v=>String(v??'').trim();
const number=v=>Number.isFinite(Number(v))?Number(v):0;

export function normalizeCoreAction(action={}){
  const type=clean(action.action_type).toLowerCase();
  const channel=clean(action.channel);
  const sourceUrl=clean(action.source_url);
  const evidence=action.evidence||{};
  return {
    id:action.action_id||action.dedupe_key,
    actionId:action.action_id||'',
    personKey:action.person_key||'',
    companyKey:action.company_key||'',
    contentKey:action.content_key||'',
    topicKey:action.topic_key||'',
    channel,
    actionType:type,
    priority:number(action.priority),
    expectedValue:number(action.expected_value_eur),
    whyNow:clean(action.reason),
    nextAction:type==='reply_dm'?'Beantwoord deze DM op basis van de getoonde context':type==='reply_post'?'Reageer inhoudelijk op deze post':type==='activate_connection'?'Activeer deze relatie via het voorgestelde kanaal':'Voer de voorgestelde actie uit',
    readyText:clean(action.message_draft),
    sourceUrl,
    evidence,
    status:action.status||'suggested',
    dueAt:action.due_at||null,
    lane:type==='reply_dm'?'dm':type==='reply_post'?'feed':type==='activate_connection'?'connections':'today',
  };
}

export function buildPowerhouseProjection({actions=[],recommendations=[],learning=[],health={}}={}){
  const normalized=actions.map(normalizeCoreAction).sort((a,b)=>b.priority-a.priority||String(a.id).localeCompare(String(b.id))).slice(0,15);
  const lane=name=>normalized.filter(item=>item.lane===name);
  return {
    schemaVersion:'powerhouse-unified-projection-v1',
    generatedAt:new Date().toISOString(),
    today:normalized,
    feed:lane('feed'),
    dm:lane('dm'),
    connections:lane('connections'),
    content:recommendations.slice(0,10),
    learning:learning.slice(0,50),
    health,
    summary:{today:normalized.length,feed:lane('feed').length,dm:lane('dm').length,connections:lane('connections').length,content:Math.min(10,recommendations.length)},
  };
}
