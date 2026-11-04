// Controlled read-only positive FTR canary: valid source, no provider side effects.
export function validSourceReadiness(){const source='verified';return Object.freeze({source,readOnly:true});}
