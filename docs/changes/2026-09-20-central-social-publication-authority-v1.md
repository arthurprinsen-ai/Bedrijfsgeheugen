# Central social publication authority v1

A documented policy is not enough when multiple components can still call providers.

## Permanent invariant
Every external social side effect requires a short-lived one-time capability issued from canonical database state. The capability is bound to the run date, exact channel ID, exact final text hash, exact final-media hash and policy version.

Instagram capability issuance additionally requires the Mira v2 contract: image or Reel only, OpenArt lineage, exact-final SHA, vision proof, Mira central, a genuine daily-life scene, and a creative that is neither text-dominant nor template-dominant.

Invalid scheduled Instagram provider state is cancellation-pending until the provider delete succeeds. Internal BLOCKED without external containment is not considered safe.

CI scans runtime code so direct provider side-effect primitives are allowed only in the canonical social publisher.

Fingerprint: central-social-publication-authority-v1


## Production status

LIVE_PROVEN on 2026-09-20.

Production readback verified the capability table and both authorization RPCs, redeployed the exact merged main publisher source as powerhouse-social-publisher version 24, confirmed ACTIVE with verify_jwt=false, and confirmed fail-closed request handling via HTTP 401 UNAUTHORIZED without the Powerhouse token. Buffer returned no pending Instagram items in scheduled/sending/approval/draft states.
