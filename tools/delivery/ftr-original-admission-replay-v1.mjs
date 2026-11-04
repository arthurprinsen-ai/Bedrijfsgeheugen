// Fixed on the SAME temporary original PR after native FTR rejected duplicate declaration.
// Source-only admission replay; never imported by production or deployed externally.
const revisionInput = 1;
export const replayMarker = 'candidate-not-to-be-merged';
export const verifiedSourceForm = Object.freeze({source:'repaired-original',value:revisionInput});
