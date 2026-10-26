# Netlify Security Trust exact-main proof

Obligation: `netlify-security-trust-exact-main-proof-v1`

## Why
Recent commits after the last Netlify production release only touched paths that are intentionally non-deploying. That left Netlify healthy but on the latest deploy-applicable ancestor instead of the current repository HEAD.

## Correction
This candidate uses the existing website delivery lane and adds one invisible source marker to `index.html`. It does not broaden deployment applicability, disable fail-closed admission, change Security Trust behavior, or add a second deployment authority.

## Terminal proof
The change may only be called LIVE_PROVEN after protected merge and Netlify production readback proves the production `commit_ref` equals that merge SHA, the Security Trust functions are present, the secret scan has no matches, and the Security Trust page/API readback succeeds.
