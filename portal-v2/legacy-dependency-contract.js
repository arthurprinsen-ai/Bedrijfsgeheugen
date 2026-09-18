import { LEGACY_FUNCTIONAL_INVENTORY } from './legacy-functional-inventory.js';
import { LEGACY_CAPABILITY_MAP } from './legacy-parity.js';

const invert=Object.freeze(Object.fromEntries(Object.entries(LEGACY_CAPABILITY_MAP).map(([legacy,v2])=>[v2,legacy])));

/**
 * Canonical cross-page dependency graph ported from the old portal inventory.
 * Dependencies are stored in legacy names because that is the frozen source
 * contract; consumers receive native Portal V2 page ids.
 */
export const LEGACY_DEPENDENCY_GRAPH=Object.freeze(Object.fromEntries(
  Object.entries(LEGACY_FUNCTIONAL_INVENTORY).map(([legacy,item])=>[
    item.v2Page,
    Object.freeze(item.dependencies.map(dep=>LEGACY_CAPABILITY_MAP[dep]||dep))
  ])
));

export function dependencyTargets(pageId){
  return [...(LEGACY_DEPENDENCY_GRAPH[pageId]||[])];
}

export function dependencySources(pageId){
  return Object.entries(LEGACY_DEPENDENCY_GRAPH)
    .filter(([,targets])=>targets.includes(pageId))
    .map(([source])=>source);
}

export function dependencyEdges(){
  return Object.entries(LEGACY_DEPENDENCY_GRAPH)
    .flatMap(([source,targets])=>targets.map(target=>Object.freeze({source,target})));
}

export function legacyIdForV2(pageId){return invert[pageId]||null}

export const CRITICAL_DEPENDENCY_CHAINS=Object.freeze([
  Object.freeze(['profiel','businesscase','roadmap']),
  Object.freeze(['profiel','overzicht','advies']),
  Object.freeze(['cijfers-maatstaven','waarde-financiering','due-diligence']),
  Object.freeze(['mensen','branche-markt','onderzoek']),
  Object.freeze(['data-ai','compliance-governance','ai-capabilities','strategy-dna']),
  Object.freeze(['strategie-naar-maandagochtend','canvassen','eindconclusie','advies','roadmap']),
  Object.freeze(['actueel-houden','wijzigingen','roadmap']),
  Object.freeze(['roadmap','uitvoeringsladder'])
]);

export const LEGACY_DEPENDENCY_CONTRACT_VERSION='2026-09-18-v1';
