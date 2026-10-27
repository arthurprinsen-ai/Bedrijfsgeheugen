# Mira canonical OpenArt reference URL recovery — 2026-10-22

Fingerprint: `mira|openart-reference-id-cdn-url-mismatch|20261022-v1`. Parent: [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439), [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).

## Production incident
The existing generation request `11JIYC1cS878LoxreAIT` failed with an upstream `No such object` error. It referenced the August CDN URL hardcoded in `mira-canonical-face.mjs`. Read-only OpenArt lookup for **the same official resource ID** `Yjqu4D7v76HABNPmQPj1` produced a different September URL; a separate metadata read proved the latter was downloadable as a 928×1152 JPEG, 741,785 bytes. The 94% face confidence gate is unchanged.

## Precise correction
Use the official provider-owned URL `https://cdn.openart.ai/openart-ai/production/2026-09/create-image/WZvuT1BzGx566fWaFo8F/image_1790665568080_41c2e10a_1790665568142_c6e526dd.jpg` for the unchanged ID in the shared canonical runtime and `config/instagram-canonical-mira-identity-v1.json`. Fix reported dimensions and add a static regression proving the ID-to-URL mapping, reject the old URL, and assert that the canonical config and code agree. No credentials or customer data were read or written.

## Verification and controlled release
Node regression, required CI and CodeQL must complete on the exact PR head. The Supabase functions importing `_shared/mira-canonical-face.mjs` must be redeployed through the approved source lineage after merge; code change alone does NOT update the deployed bundle. Re-verify a genuinely new OpenArt Mira source matching the selected canonical problem, exact URL/hash, frame snapshots and independently assessed identity at start/middle/end (>=0.94). Instagram remains non-live until provider ID and canonical URL readback. No duplicated scheduler, fake green, consent bypass, non-OpenArt fallback or retroactive repost.
