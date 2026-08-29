import { createPortalProjectionStore } from './_portal-read-model-store.mjs';
import { createCanonicalPortalProjector } from '../../platform/read-models/canonical-portal-projector.mjs';

const projector=createCanonicalPortalProjector({store:createPortalProjectionStore(),actorId:'brain-read-model-projector'});
export async function projectCanonicalPortalObject(canonicalObject){return projector.project(canonicalObject);}
