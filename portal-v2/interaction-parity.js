const interaction=(id,area,status,evidence)=>Object.freeze({id,area,status,evidence});

export const INTERACTION_PARITY_MANIFEST=Object.freeze([
 interaction('roadmap-card-reorder','roadmap','proven','portal-v2/tests/interaction-parity.test.mjs'),
 interaction('roadmap-card-sprint-move','roadmap','proven','tests/integration/portal-v2-functional-parity.spec.js'),
 interaction('feature-story-drag','strategy-execution','proven','tests/integration/portal-v2-functional-parity.spec.js'),
 interaction('strategy-card-reorder','strategy','open','legacy drag contract identified; native V2 implementation pending'),
 interaction('overview-block-reorder','overzicht','open','legacy drag contract identified; native V2 implementation pending')
]);

export function openInteractionObligations(){
 return INTERACTION_PARITY_MANIFEST.filter(item=>item.status!=='proven');
}
