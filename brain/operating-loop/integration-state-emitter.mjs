import { createIntegrationCurrentStateFromSource } from './integration-current-state.mjs';

export function createIntegrationStateEmitter({client}={}){
  if(!client||typeof client.post!=='function') throw new TypeError('Integration state emitter requires a post-capable client');

  return Object.freeze({
    async emit(input={}){
      const record=createIntegrationCurrentStateFromSource(input);
      const source=record.provenance.source;
      const sourceId=record.provenance.sourceId;
      const idempotencyKey=`current-state:${source}:${sourceId}`;
      return client.post(record,{idempotencyKey});
    }
  });
}
