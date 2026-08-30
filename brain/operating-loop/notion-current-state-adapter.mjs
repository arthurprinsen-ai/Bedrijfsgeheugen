const required=(value,name)=>{
  if(value===undefined||value===null||String(value).trim()==='') throw new TypeError(`Notion CurrentState adapter requires ${name}`);
  return String(value).trim();
};

const mapPageState=({archived=false,inTrash=false}={})=>{
  if(inTrash) return {health:'unhealthy',capacity:'interrupted',executionStatus:'trashed',error:'NOTION_PAGE_TRASHED'};
  if(archived) return {health:'degraded',capacity:'interrupted',executionStatus:'archived',error:null};
  return {health:'healthy',capacity:'available',executionStatus:'available',error:null};
};

export function createNotionCurrentStateInput({tenantId,pageId,databaseId,title,lastEditedTime,archived=false,inTrash=false}={}){
  const tenant=required(tenantId,'tenantId');
  const page=required(pageId,'pageId');
  const database=required(databaseId,'databaseId');
  const name=title===undefined||title===null?'':String(title).trim();
  const observedAt=required(lastEditedTime,'lastEditedTime');
  const mapped=mapPageState({archived:Boolean(archived),inTrash:Boolean(inTrash)});

  return {
    tenantId:tenant,
    source:'notion',
    id:`notion-current-state:${database}:${page}`,
    component:`notion:${database}:${page}`,
    raw:{
      page_id:page,
      database_id:database,
      last_edited_time:observedAt,
      title:name,
      archived:Boolean(archived),
      in_trash:Boolean(inTrash)
    },
    observedAt,
    health:mapped.health,
    error:mapped.error,
    owner:'notion',
    cost:null,
    revision:observedAt,
    capacity:mapped.capacity,
    executionStatus:mapped.executionStatus,
    verified:true
  };
}
