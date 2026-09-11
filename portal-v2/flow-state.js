const ACTIVE = new Set(['running','verified']);
const STOPPED = new Set(['blocked','failed']);

export function deriveFlowState({ source=null, module=null, runtime=null, preview=false }={}) {
  if (!source) return { sourceFlow:false, processingFlow:false, outputFlow:false, status:'idle', reason:'no-source' };

  // A user selection is focus only. It does not claim a live runtime flow.
  if (!runtime && !preview) {
    return { sourceFlow:false, processingFlow:false, outputFlow:false, status:'selected', reason:'no-runtime-evidence' };
  }

  const state = preview ? 'running' : String(runtime?.status || 'idle');
  if (STOPPED.has(state)) {
    return { sourceFlow:true, processingFlow:false, outputFlow:false, status:state, reason:runtime?.reason || state };
  }
  if (!ACTIVE.has(state)) {
    return { sourceFlow:false, processingFlow:false, outputFlow:false, status:state, reason:runtime?.reason || 'not-active' };
  }

  return {
    sourceFlow:true,
    processingFlow:true,
    outputFlow:Boolean(module),
    status:preview ? 'preview' : state,
    reason:preview ? 'explicit-preview' : 'runtime-evidence'
  };
}

export function statusLabel(state) {
  return ({ idle:'Geen stroom', selected:'Geselecteerd', preview:'Voorbeeldflow', running:'Actief', verified:'Geverifieerd', blocked:'Geblokkeerd', failed:'Fout' })[state] || state;
}

/* ---------------------------------------------------------------------------
 * Powerhouse-route, geport uit portal-next/portal-flow-renderer.js.
 *
 * De rest van die flowlaag was hier al gedekt, en strenger: deriveFlowState
 * hierboven weigert stroom te tonen zonder runtime-bewijs, waar portal-next een
 * selectie soms al als beweging liet zien. Wat daar wél in zat en hier niet, is
 * de volgorde van de agenten en de regel dat de route stopt bij de eerste die
 * vastloopt. Wat daarachter zit is niet bereikt en hoort niet getoond te worden.
 *
 * Bewust geen tweede flow-module: twee lagen die hetzelfde beweren en apart
 * verouderen is precies hoe portal, portal-next en portal-v2 uit elkaar zijn
 * gegroeid.
 * ------------------------------------------------------------------------- */

const AGENT_VOLGORDE = Object.freeze(['detectie', 'analyse', 'uitvoering', 'verificatie', 'self-heal', 'learning']);
const STIL = new Set(['idle', 'disconnected']);
const VASTGELOPEN = new Set(['blocked', 'failed']);

/** Een gepauzeerde agent met een openstaande herstelplicht is geblokkeerd, niet stil. */
export function agentStatus(agent = {}) {
  const status = String(agent.status || 'idle');
  if ((status === 'paused' || status === 'disabled') && agent.recoveryObligation?.open) return 'blocked';
  return status;
}

/**
 * De route door het Powerhouse in vaste volgorde, tot en met de eerste agent
 * die vastloopt. Stille agenten komen er niet in: die doen niets.
 */
export function powerhouseRoute(agents = []) {
  const perCategorie = new Map((Array.isArray(agents) ? agents : [])
    .map(agent => [String(agent?.category || agent?.categorie || 'uitvoering'), agent]));
  const route = [];
  for (const categorie of AGENT_VOLGORDE) {
    const agent = perCategorie.get(categorie);
    if (!agent) continue;
    const status = agentStatus(agent);
    if (STIL.has(status)) continue;
    route.push({
      categorie,
      naam: String(agent.name || agent.naam || agent.id || categorie),
      status,
      bewijs: (Array.isArray(agent.evidence) ? agent.evidence : []).filter(Boolean).length
    });
    if (VASTGELOPEN.has(status)) break;
  }
  return route;
}

/** De route als rijtje voor een ladder: waar loopt het, en waar stopt het? */
export function routeOverzicht(agents = []) {
  const route = powerhouseRoute(agents);
  const stopIndex = route.findIndex(stap => VASTGELOPEN.has(stap.status));
  return route.map((stap, index) => ({
    naam: stap.naam,
    uitleg: `${statusLabel(stap.status)} · ${stap.bewijs} bewijsstuk${stap.bewijs === 1 ? '' : 'ken'}`,
    bereikt: stopIndex === -1 ? true : index < stopIndex,
    huidig: stopIndex === index
  }));
}
