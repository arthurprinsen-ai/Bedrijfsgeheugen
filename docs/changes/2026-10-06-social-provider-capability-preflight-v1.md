# Social provider capability preflight

Date: 2026-10-06

The canonical publisher now distinguishes a usable personal LinkedIn identity from a verified organization-capable company connection.

For LinkedIn company, an ACTIVE connection is insufficient. The selected account must prove approved administrator visibility for the canonical organization before the existing one-time publication capability can be issued. If no such account exists, the claim remains resumable and no provider write is attempted.

The Instagram media verifier continues to require the approved vision gate. Anthropic HTTP 400 responses that explicitly report an exhausted credit balance are now surfaced as `VISION_PROVIDER_CREDIT_EXHAUSTED` instead of a generic request failure. This is diagnostic only; it does not weaken or bypass visual verification.

Production state at the time of this change:
- personal LinkedIn already has provider-create acknowledgement for `urn:li:share:7513180628259852288`; exact API content readback is permission-limited, so republishing is forbidden;
- company LinkedIn is still `content_ready`, has no delivery reference and no provider-create proof;
- Instagram remains fail-closed until its required media/vision proof is accepted.

No Buffer/Make fallback and no second provider writer are introduced.
