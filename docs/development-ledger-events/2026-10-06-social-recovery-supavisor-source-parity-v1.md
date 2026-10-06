# Social recovery Supavisor/source-parity closure

Date: 2026-10-06  
Obligation: social-daily-publication-no-gap-transport-20261006-v2

Observed:
- production Supabase remained healthy in eu-central-1 while the incident path had shown PostgREST/Data API failures;
- critical publication runtime had already moved to the EU Supavisor endpoint;
- same-day recovery could survive degraded preparation after #3837, but repository source still lacked the canonical recovery runner;
- LinkedIn personal and company claims were proven resumable with no provider-side effect;
- LinkedIn company OAuth/config boundaries were incorrectly surfaced as HTTP 500 before the resumable classifier repair.

Structural repair:
- source-control the deployed social-recovery-runner and register it as a required quality surface;
- use direct Supavisor state readback in the recovery control plane;
- skip heavyweight content-loop preparation when required claims are already content_ready or terminal;
- otherwise bound preparation to 60 seconds;
- invoke only powerhouse-social-publisher in bounded per-channel publish_only mode for unresolved content_ready claims;
- keep powerhouse-social-publisher as the only provider side-effect authority;
- classify LinkedIn company pin/admin-scope/re-auth boundaries as resumable before provider side effects;
- keep final canonical state/provider-truth readback fail-closed;
- preserve sanitized recovery evidence under recovery-artifacts/.

Runtime evidence:
- personal LinkedIn now reaches the publisher and returns waiting_reauth / LINKEDIN_REAUTH_REQUIRED instead of PERSONAL_SOURCE_UNVERIFIED;
- company LinkedIn now returns waiting_reauth / LINKEDIN_REAUTH_REQUIRED instead of HTTP 500;
- neither unresolved LinkedIn claim has a delivery_ref, provider post id, provider-create acknowledgement or proven provider side effect;
- the remaining external boundary is LinkedIn OAuth authorization, including r_organization_admin for the company page.

Release closure requires:
- exact-head CI green;
- protected merge;
- post-merge repository/runtime parity readback;
- fresh same-day recovery/readback;
- publication remains unresolved until LinkedIn OAuth succeeds and provider-backed truth is proven.
