# 2026-10-06 — versioned delivery metadata authority

- Failure: `tests/powerhouse-one-loop-versioned-metadata-authority.test.mjs` expected `versioned-manifest` but observed `pr-body`.
- Root cause: complete mutable PR metadata was incorrectly promoted above a valid immutable same-obligation manifest.
- Repair: remove the complete-PR-body precedence branch in `resolveDeliveryMetadataAuthority`.
- Safety: different-obligation manifests remain unable to take authority.
- Historical replay: existing versioned metadata authority test.
