# LinkedIn Composio chain provider isolation v1

Date: 25 September 2026
Fingerprint: linkedin-composio-chain-provider-isolation-v1

## Incident

Today's canonical LinkedIn decisions existed, but no LinkedIn content artifacts were produced. Health evidence showed repeated artifact-ai:AI_PROVIDER_REQUEST_FAILED failures. Independently, the supervisor still called legacy bg-buffer-sync without containment.

## Invariant

LinkedIn personal and LinkedIn company use Composio as the only publication transport authority. A Buffer outage, HTTP 429, failed Buffer sync, or missing Buffer token may not block, downgrade, delay, retry, or replace a LinkedIn claim.

Provider truth for LinkedIn is the exact LinkedIn post URN returned by Composio plus exact LinkedIn readback. Unknown truth fails closed and never authorizes a second write.

## Changes

- legacy Buffer sync is compatibility telemetry and always non-blocking for the canonical content loop;
- Anthropic generation errors retain sanitized HTTP status and model name instead of collapsing to an opaque error;
- AI calls are bounded by a 45-second timeout;
- regression tests enforce both invariants.

The LinkedIn company connection still requires valid LinkedIn organization permissions. Missing organization scope is a Composio/LinkedIn hard boundary, not a reason to fall back to Buffer.

## Anthropic 400 diagnostic follow-up

Production after the first fix proved HTTP 400 from Anthropic for the governed content request. The runtime now records only the provider error type/message, capped at 240 characters. Request bodies, source content, prompts and credentials are never logged.

## Composio generation fallback

The exact production provider error was `invalid_request_error`: the Anthropic credit balance was too low. To remove that single point of failure, artifact generation now has a separately governed Composio/Groq fallback (`openai/gpt-oss-120b`). It activates only for provider availability failures such as credit exhaustion, missing/invalid provider access, throttling or 5xx. Request/schema defects remain fail-closed.

The fallback only creates the same six-field content artifact. It cannot publish. All existing identity, truth, publication-authority, duplicate-prevention and LinkedIn exact-URN readback gates remain mandatory.
