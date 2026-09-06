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
  const dx = Math.max(56, Math.abs(b.x-a.x)*0.42);
  path.setAttribute('d', `M ${a.x} ${a.y} C ${a.x+dx} ${a.y}, ${b.x-dx} ${b.y}, ${b.x} ${b.y}`);
  path.dataset.mode = enabled ? mode : 'hidden';
  path.dataset.tone = tone;
  return path;
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
  if (source) renderFlowPath(svg, source, datahub, shouldRenderFlow('source-to-datahub',state), flowVisualState(state.source.status).line, flowVisualState(state.source.status).tone);
  renderFlowPath(svg, datahub, brain, shouldRenderFlow('datahub-to-brain',state), flowVisualState(state.brain.status).line, flowVisualState(state.brain.status).tone);
  if (module) renderFlowPath(svg, brain, module, shouldRenderFlow('brain-to-module',state), flowVisualState(state.module.status).line, flowVisualState(state.module.status).tone);
}
