import {decide} from './policy.mjs';
export function rankPortfolio(candidates,active=[],maxLarge=3){
  const used=active.filter(x=>x.large_experiment&&['ACTIVE','RECOVERING'].includes(x.status)).length;
  let remaining=Math.max(0,maxLarge-used);
  return candidates.map(c=>({...c,...decide(c)})).sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity)).map(x=>{
    if(!x.large_experiment) return {...x,admitted:x.decision!=='PAUSE'&&x.decision!=='WATCH'};
    const executable=!['PAUSE','WATCH','RESEARCH','ESCALATE_HARD_BOUNDARY'].includes(x.decision);
    const admitted=executable&&remaining>0; if(admitted) remaining--; return {...x,admitted};
  });
}
