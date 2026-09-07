import { shouldRenderFlow } from './portal-flow-state.js';

export function renderStatusClass(status) {
  return ({idle:'is-idle',queued:'is-queued',running:'is-running',waiting:'is-waiting',blocked:'is-blocked',failed:'is-failed',recovering:'is-recovering',verified:'is-verified',completed:'is-completed',disconnected:'is-disconnected'})[status] ?? 'is-idle';
}

export function flowVisualState(status) {
  if (status === 'idle' || status === 'disconnected') return { line:'hidden', tone:'muted' };
  if (status === 'blocked' || status === 'failed') return { line:'stopped', tone:'danger' };
  if (status === 'recovering' || status === 'waiting') return { line:'animated', tone:'warning' };
  if (status === 'verified' || status === 'completed') return { line:'steady', tone:'success' };
  return { line:'animated', tone:'active' };
}

const AGENT_ORDER=['detectie','analyse','uitvoering','verificatie','self-heal','learning'];
export function getPowerhouseRoute(state={}) {
  const byCategory=new Map((state.powerhouse??[]).map(agent=>[agent.category,agent]));
  const route=[];
  for(const category of AGENT_ORDER){
    const agent=byCategory.get(category);
    if(!agent || ['idle','disconnected'].includes(agent.status)) continue;
    route.push(agent);
    if(['blocked','failed'].includes(agent.status)) break;
  }
  return route;
}

function center(el, root) {
  const r = el.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  return { x:r.left-rr.left+r.width/2, y:r.top-rr.top+r.height/2 };
}

export function renderFlowPath(svg, fromEl, toEl, enabled, mode='animated', tone='active') {
  if (!svg || !fromEl || !toEl) return null;
  let path = svg.querySelector(`path[data-from="${fromEl.dataset.flowNode}"][data-to="${toEl.dataset.flowNode}"]`);
  if (!path) {
    path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.classList.add('brain-flow');
    path.dataset.from = fromEl.dataset.flowNode;
    path.dataset.to = toEl.dataset.flowNode;
    svg.appendChild(path);
  }
  const a = center(fromEl, svg.parentElement);
  const b = center(toEl, svg.parentElement);
  const direction=b.x>=a.x?1:-1;
  const dx = Math.max(42, Math.abs(b.x-a.x)*0.42);
  path.setAttribute('d', `M ${a.x} ${a.y} C ${a.x+(dx*direction)} ${a.y}, ${b.x-(dx*direction)} ${b.y}, ${b.x} ${b.y}`);
  path.dataset.mode = enabled ? mode : 'hidden';
  path.dataset.tone = tone;
  return path;
}

function agentNode(root,agent){
  const nodeMap={detectie:'agent-monitor',analyse:'agent-analyse',uitvoering:'agent-execute',verificatie:'agent-verify','self-heal':'agent-heal',learning:'agent-learning'};
  return root.querySelector(`[data-flow-node="${nodeMap[agent.category]}"]`);
}

export function renderPortalFlow(root, state) {
  if (!root) return;
  const svg = root.querySelector('#flow-layer');
  if (!svg) return;
  svg.innerHTML='';
  const source = state.source ? root.querySelector(`[data-source-id="${state.source.id}"]`) : null;
  const datahub = root.querySelector('[data-flow-node="datahub"]');
  const brain = root.querySelector('[data-flow-node="brain"]');
  const module = state.module ? root.querySelector(`[data-module-id="${state.module.id}"]`) : null;
  const action = root.querySelector('[data-flow-node="action"]');
  const outcome = root.querySelector('[data-flow-node="outcome"]');
  const learning = root.querySelector('[data-flow-node="learning"]');

  if (source) {
    const visual=flowVisualState(state.source.status);
    renderFlowPath(svg, source, datahub, shouldRenderFlow('source-to-datahub',state), visual.line, visual.tone);
  }
  {
    const visual=flowVisualState(state.brain.status);
    renderFlowPath(svg, datahub, brain, shouldRenderFlow('datahub-to-brain',state), visual.line, visual.tone);
  }

  const route=getPowerhouseRoute(state);
  let routeTail=brain;
  let routeBlocked=false;
  if(route.length && shouldRenderFlow('brain-to-powerhouse',state)){
    for(const agent of route){
      const node=agentNode(root,agent);
      if(!node) continue;
      const visual=flowVisualState(agent.status);
      renderFlowPath(svg,routeTail,node,true,visual.line,visual.tone);
      routeTail=node;
      if(['blocked','failed'].includes(agent.status)){routeBlocked=true;break;}
    }
  }

  if(module && !routeBlocked){
    const visual=flowVisualState(state.module.status);
    renderFlowPath(svg,routeTail,module,shouldRenderFlow('brain-to-module',state),visual.line,visual.tone);
  }
  if(module && action && state.action && !routeBlocked && !['idle','disconnected','failed'].includes(state.action.status)){
    const visual=flowVisualState(state.action.status);
    renderFlowPath(svg,module,action,true,visual.line,visual.tone);
  }
  if(action && outcome && state.outcome && !routeBlocked && !['idle','disconnected'].includes(state.outcome.status)){
    const visual=flowVisualState(state.outcome.status);
    renderFlowPath(svg,action,outcome,true,visual.line,visual.tone);
  }
  if(outcome && learning && shouldRenderFlow('outcome-to-learning',state)){
    const visual=flowVisualState(state.learning.status);
    renderFlowPath(svg,outcome,learning,true,visual.line,visual.tone);
  }
}
