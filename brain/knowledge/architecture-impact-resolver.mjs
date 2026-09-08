import {analyzeChangeImpact} from '../operating-loop/change-impact.mjs';

const uniq=xs=>[...new Set(xs.filter(Boolean))];
const changedPaths=event=>Array.isArray(event?.action?.technical_changes)?event.action.technical_changes.map(String):[];

const matchPattern=(value,pattern)=>{
  if(!pattern) return false;
  if(pattern.endsWith('/**')) return value.startsWith(pattern.slice(0,-3));
  if(pattern.endsWith('*')) return value.startsWith(pattern.slice(0,-1));
  return value===pattern;
};

export function resolveArchitectureImpact(event,{registry,graphRecords=[],tenantId}={}){
  const changes=changedPaths(event);
  const components=Array.isArray(registry?.components)?registry.components:[];
  const matched=components.filter(component=>{
    const paths=Array.isArray(component.paths)?component.paths:[];
    const routes=Array.isArray(component.routes)?component.routes:[];
    const scenarios=Array.isArray(component.scenarios)?component.scenarios.map(String):[];
    return changes.some(change=>paths.some(pattern=>matchPattern(change,pattern))) ||
      (event?.route&&routes.includes(String(event.route))) ||
      (event?.scenario_id&&scenarios.includes(String(event.scenario_id))) ||
      (event?.component&&String(event.component)===String(component.id));
  });
  if(matched.length===0){
    return Object.freeze({status:'UNMAPPED',components:[],layers:[],dependencies:[],blast_radius:[],documentation_surfaces:[],expected_tests:[],rollback_owner:[],confidence:0});
  }
  const ids=uniq(matched.map(x=>x.id));
  const dependencies=uniq(ids.flatMap(id=>analyzeChangeImpact(graphRecords,{tenantId,subjectId:id,maxDepth:2}).impacts.map(x=>x.subjectId)));
  return Object.freeze({
    status:'MAPPED',
    components:ids,
    layers:uniq(matched.map(x=>x.layer)),
    dependencies,
    blast_radius:uniq(matched.flatMap(x=>x.blastRadius||[])),
    documentation_surfaces:uniq(matched.flatMap(x=>x.docs||[])),
    expected_tests:uniq(matched.flatMap(x=>x.tests||[])),
    rollback_owner:uniq(matched.map(x=>x.rollbackOwner)),
    confidence:1
  });
}
