import {createBrainRuntime} from './runtime.mjs';
import {createProjectedBrainRuntime} from './projected-runtime.mjs';
import {createCanonicalPortalProjector} from '../read-models/canonical-portal-projector.mjs';

export function createProductionBrainRuntime({portalProjectionStore,projectionActorId='brain-production-runtime',...runtimeOptions}={}){
 if(!portalProjectionStore?.getLayer||!portalProjectionStore?.putCanonical)throw new TypeError('portalProjectionStore is required');
 const raw=createBrainRuntime(runtimeOptions);
 const projector=createCanonicalPortalProjector({store:portalProjectionStore,actorId:projectionActorId,now:runtimeOptions.now});
 return createProjectedBrainRuntime({runtime:raw,projector});
}
