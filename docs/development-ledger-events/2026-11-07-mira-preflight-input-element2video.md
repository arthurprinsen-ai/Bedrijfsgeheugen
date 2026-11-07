# Mira producer preflight input and element2video format gate — development ledger

- 2026-11-07, owner: original Mira producer and instagram media router.
- Fingerprint: `mira|reel|producer-preflight-incomplete-input-and-element2video-unrecognised|20261107-v1`.
- Source: scheduled producer run, preflight HTTP 422, then MIRA_PROVIDER_OUTPUT_CONTRACT_UNPROVEN for veo3-1 element2video. No generation, 0 credits.
- Repair: veo3-1 element2video accepted by the format gate with 9:16 and no audio; skill lists the complete preflight input; test added.
- Known limit: not proven on a real generation yet; identity, temporal and Meta readback gates unchanged.
- Status: CODE_CANDIDATE, not verified until PR #5516 is merged, deployed and a natural run produces a verified Reel.
