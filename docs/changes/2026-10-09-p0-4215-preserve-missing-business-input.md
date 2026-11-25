# P0 #4215 — lossless partial BusinessInput read/replay projection

## Verified code defect

The existing Portal V2 domain state emits `metadata.preserveMissing=true` for each authenticated BusinessInput. However the authoritative `projectCanonicalObject` projected updates with `answers: obj(d.answers)`, causing a partial form update to erase previously stored answer keys. The independent Supabase `repairBusinessInputsFromAuthority` also replaced the entire old answers object while replaying newer partial Brain records. Finance fields, AI governance evidence and MTO follow-ups could disappear even when source truth was still present.

## Existing-state-first fix

One pure, side-effect-free merge helper in `supabase/functions/_shared/portal-business-input-answer-merge.js` shared by Netlify platform canonical projector and Supabase Edge read-repair.
Only when incoming `metadata.preserveMissing === true` and the same model instance already exists, recursively preserve **missing** object properties. Explicit `null`, `false`, numeric zero, empty text and arrays are intentional replacements. Without the flag, a full authoritative update still replaces the answers object. Repaired source revision and Brain IDs follow the latest record. No new Brain, outbox, identity authority or storage.

## Validation

`node --test tests/brain-p0-4215-preserve-missing-canonical-read-repair-v1.test.mjs tests/portal-projection-layers.test.mjs tests/portal-business-input.test.mjs`

Regression covers nested finance, people and AI data; deliberate emptying; full replacement; shuffled chronological Brain repair; stale record rejection; prototype-pollution field names.

## Truth boundary

Passing source and CI tests is not actual customer provider runtime proof. Netlify and Supabase Edge production have independent release authorities; verify both. A real signed-in two-tenant BusinessInput→Brain→roadmap/action readback remains required, along with durable >750 KB transactional split/outbox proof. Do not close P0 #4215 without these.
