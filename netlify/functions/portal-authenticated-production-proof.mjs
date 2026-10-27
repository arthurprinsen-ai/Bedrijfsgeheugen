import {randomBytes} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import {admin,getIdentityConfig} from '@netlify/identity';
import {
  PORTAL_AUTH_PROOF_STORE,
  portalAuthProofKey,
  runPortalAuthenticatedProductionProof,
} from '../../platform/api/portal-authenticated-production-proof-core.mjs';

const randomPassword=()=>randomBytes(32).toString('base64url');

export default {
  async deploySucceeded(event){
    const deploy=event?.deploy;
    if(deploy?.context!=='production'||!deploy?.commitRef||!deploy?.id)return;

    const store=getStore(PORTAL_AUTH_PROOF_STORE);
    const proof=await runPortalAuthenticatedProductionProof({
      deploy,
      identityAdmin:admin,
      getIdentityConfigFn:getIdentityConfig,
      fetchImpl:fetch,
      randomPassword,
    });

    await store.setJSON(portalAuthProofKey(deploy.commitRef),proof);
    if(proof.status!=='PROVEN'){
      console.error(`PORTAL_AUTHENTICATED_PRODUCTION_PROOF_FAILED ${proof.commit_ref} ${proof.deploy_id} ${proof.failure_code||'UNKNOWN'}`);
      return;
    }
    console.log(`PORTAL_AUTHENTICATED_PRODUCTION_PROOF_PROVEN ${proof.commit_ref} ${proof.deploy_id}`);
  },
};
