import { createDeliveryAdapter } from './contract.mjs';

export const adapters=Object.freeze({
  github:createDeliveryAdapter({platform:'github',productionIdentity:'exact-merge-sha',requiredEvidence:['mergeSha'],rollbackKind:'revert-offending-merge'}),
  netlify:createDeliveryAdapter({platform:'netlify',productionIdentity:'deploy-id-plus-commit-ref',requiredEvidence:['deployId','commitRef','state'],rollbackKind:'publish-last-known-good-deploy'}),
  make:createDeliveryAdapter({platform:'make',productionIdentity:'scenario-id-plus-lastEdit',requiredEvidence:['scenarioId','lastEdit'],rollbackKind:'restore-last-known-good-blueprint'}),
  notion:createDeliveryAdapter({platform:'notion',productionIdentity:'object-id-plus-last-edited-version',requiredEvidence:['objectId','lastEditedVersion'],rollbackKind:'restore-previous-safe-object-state'}),
  supabase:createDeliveryAdapter({platform:'supabase',productionIdentity:'migration-or-object-state-version',requiredEvidence:['stateVersion'],rollbackKind:'transaction-rollback-or-down-migration'}),
  dataforseo:createDeliveryAdapter({platform:'dataforseo',productionIdentity:'query-contract-plus-source-timestamp',requiredEvidence:['queryContract','sourceTimestamp'],rollbackKind:'restore-last-known-good-query-config'})
});
