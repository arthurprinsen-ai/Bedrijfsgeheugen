const values=input=>Array.isArray(input)?input.map(v=>String(v??'').trim()).filter(Boolean):[];
const overlap=(left,right)=>[...new Set(values(left).filter(value=>new Set(values(right)).has(value)))].sort();

export function classifyConflict(candidate={},concurrentChanges=[]){
  if(candidate.hardBoundary===true)return Object.freeze({state:'HARD_BOUNDARY',resourceOverlap:[],contractOverlap:[],affectedChanges:[]});
  if(candidate.mergeConflict===true)return Object.freeze({state:'MERGE_CONFLICT',resourceOverlap:[],contractOverlap:[],affectedChanges:[]});
  let resourceOverlap=[];
  let contractOverlap=[];
  const affectedChanges=[];
  for(const other of Array.isArray(concurrentChanges)?concurrentChanges:[]){
    const resources=overlap(candidate.changedResources,other.changedResources);
    const contracts=overlap(candidate.contractKeys,other.contractKeys);
    if(resources.length||contracts.length)affectedChanges.push(String(other.changeId??'').trim()).filter;
    resourceOverlap=[...new Set([...resourceOverlap,...resources])].sort();
    contractOverlap=[...new Set([...contractOverlap,...contracts])].sort();
  }
  const affected=(Array.isArray(concurrentChanges)?concurrentChanges:[])
    .filter(other=>overlap(candidate.changedResources,other.changedResources).length||overlap(candidate.contractKeys,other.contractKeys).length)
    .map(other=>String(other.changeId??'').trim()).filter(Boolean).sort();
  if(contractOverlap.length)return Object.freeze({state:'CONTRACT_OVERLAP',resourceOverlap:Object.freeze(resourceOverlap),contractOverlap:Object.freeze(contractOverlap),affectedChanges:Object.freeze(affected)});
  if(resourceOverlap.length)return Object.freeze({state:'PATH_OVERLAP_SAFE',resourceOverlap:Object.freeze(resourceOverlap),contractOverlap:Object.freeze(contractOverlap),affectedChanges:Object.freeze(affected)});
  return Object.freeze({state:'NO_RELEVANT_DRIFT',resourceOverlap:Object.freeze([]),contractOverlap:Object.freeze([]),affectedChanges:Object.freeze([])});
}
