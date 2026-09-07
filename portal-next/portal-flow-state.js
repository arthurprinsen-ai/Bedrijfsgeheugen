import './portal-navigation-complete.js';
import './portal-business-os-navigation.js';

if (typeof document !== 'undefined' && !document.querySelector('link[data-portal-navigation-complete]')) {
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='/portal-next/portal-navigation-complete.css';
  link.dataset.portalNavigationComplete='';
  document.head.append(link);
}

const VALID = new Set(['idle','queued','running','waiting','blocked','failed','recovering','verified','completed','disconnected']);
function normalizeStatus(value, fallback = 'idle') { return VALID.has(value) ? value : fallback; }
function normalizeAgent(agent = {}) { let status = normalizeStatus(agent.status); if ((agent.status === 'paused' || agent.status === 'disabled') && agent.recoveryObligation?.open) status = 'blocked'; return { id: agent.id ?? 'unknown-agent', name: agent.name ?? agent.id ?? 'Onbekende agent', category: agent.category ?? 'uitvoering', status, evidence: Array.isArray(agent.evidence) ? agent.evidence.filter(Boolean) : [], recoveryObligation: agent.recoveryObligation ?? null, lastRunAt: agent.lastRunAt ?? null, triggerReason: agent.triggerReason ?? null, error: agent.error ?? null, learningStatus: normalizeStatus(agent.learningStatus ?? 'idle') }; }
export function normalizePortalFlowState(raw = {}) { return { source: raw.source ? { ...raw.source, status: normalizeStatus(raw.source.status) } : null, datahub: { ...(raw.datahub ?? {}), status: normalizeStatus(raw.datahub?.status ?? 'idle') }, brain: { ...(raw.brain ?? {}), status: normalizeStatus(raw.brain?.status ?? 'idle'), capabilities: Array.isArray(raw.brain?.capabilities) ? raw.brain.capabilities : [] }, powerhouse: (raw.powerhouse ?? []).map(normalizeAgent), module: raw.module ? { ...raw.module, status: normalizeStatus(raw.module.status) } : null, action: raw.action ? { ...raw.action, status: normalizeStatus(raw.action.status) } : null, outcome: raw.outcome ? { ...raw.outcome, status: normalizeStatus(raw.outcome.status) } : null, learning: { ...(raw.learning ?? {}), status: normalizeStatus(raw.learning?.status ?? 'idle') }, updatedAt: raw.updatedAt ?? null }; }
export function hasActiveInput(state) { return !!state.source && !['idle','disconnected','failed'].includes(state.source.status); }
export function hasVerifiedExecution(state) { return state.powerhouse.some(a => ['verified','completed'].includes(a.status) && a.evidence.length > 0); }
export function shouldRenderFlow(segment, state) { if (segment === 'source-to-datahub') return hasActiveInput(state); if (segment === 'datahub-to-brain') return hasActiveInput(state) && !['failed','blocked','disconnected'].includes(state.datahub.status); if (segment === 'brain-to-powerhouse') return state.powerhouse.some(a => ['queued','running','waiting','blocked','recovering','verified','completed'].includes(a.status)); if (segment === 'brain-to-module') return !!state.module && !['idle','disconnected','failed'].includes(state.module.status); if (segment === 'outcome-to-learning') return !!state.outcome?.evidenceId && ['verified','completed'].includes(state.outcome.status); return false; }
