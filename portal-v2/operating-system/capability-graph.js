const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};

export function buildCapabilityGraph({capabilities={},strategy=[],objectives=[],actions=[],outcomes=[]}={}){
 const nodes=new Map(),edges=new Map();
 const addNode=(id,type,label,meta={})=>{if(!nodes.has(id))nodes.set(id,{id,type,label,meta});};
 const addEdge=(from,to,type='relates')=>{const key=`${from}>${to}`;if(!edges.has(key))edges.set(key,{from,to,type});};
 const addLeaves=(capId,field,type,values=[])=>{for(const value of values){const id=`${type}:${value}`;addNode(id,type,String(value));addEdge(capId,id,type);}};
 for(const [key,cap] of Object.entries(capabilities)){
  const capId=`capability:${key}`;addNode(capId,'capability',cap.n||key,{dimension:cap.dim||null});
  addLeaves(capId,'proc','process',cap.proc);addLeaves(capId,'sys','system',cap.sys);addLeaves(capId,'data','data',cap.data);addLeaves(capId,'ai','ai',cap.ai);addLeaves(capId,'gov','governance',cap.gov);addLeaves(capId,'kpi','kpi',cap.kpi);addLeaves(capId,'proj','project',cap.proj);
 }
 for(const item of strategy){const id=`strategy:${item.id}`;addNode(id,'strategy',item.label||item.name||item.id);for(const objectiveId of item.objective_ids||[])addEdge(id,`objective:${objectiveId}`,'objective');}
 for(const objective of objectives){const id=`objective:${objective.id}`;addNode(id,'objective',objective.label||objective.name||objective.id);for(const capabilityId of objective.capability_ids||[])addEdge(id,`capability:${capabilityId}`,'capability');}
 for(const action of actions){const id=`action:${action.id}`;addNode(id,'action',action.title||action.label||action.id,{state:action.state||null});if(action.capability_id)addEdge(`capability:${action.capability_id}`,id,'action');}
 for(const outcome of outcomes){const id=`outcome:${outcome.id}`;addNode(id,'outcome',outcome.title||outcome.label||outcome.id,{kind:outcome.kind||null});if(outcome.action_id)addEdge(`action:${outcome.action_id}`,id,'outcome');}
 return freeze({nodes:[...nodes.values()],edges:[...edges.values()]});
}

export function neighbors(graph,nodeId){
 const ids=new Set();for(const edge of graph?.edges||[]){if(edge.from===nodeId)ids.add(edge.to);if(edge.to===nodeId)ids.add(edge.from);}const byId=new Map((graph?.nodes||[]).map(node=>[node.id,node]));return Object.freeze([...ids].map(id=>byId.get(id)).filter(Boolean));
}
