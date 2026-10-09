# P0 #4215 — native DOM field lineage without inventing live ACK

## Source defect
The generated Portal V2 customer input controls previously provided `data-field-id` and `data-field-type` but no canonical `portal.*` path, preventing a browser DOM inventory from directly asserting each input's source-record dependency path. The schema-only matrix did not prove actual hydrated input provenance.

## Bounded existing-state improvement
Add escaped `data-field-path` to the canonical `fieldMarkup` primitive. Every generated control, including repeatable-group roots, carries the source schema path with no customer values, access credentials, or second state store. Fields lacking a configured path render an explicitly empty attribute and remain unmapped.
Extend protected Required preflight and Brain learning tests to check every declared native field across all registered pages, unusual HTML/XSS labels and paths, and repeatable-group boundaries. Client binding and canonical write endpoint are otherwise unchanged.

## Verification
`node --test tests/brain-p0-4215-native-form-dom-lineage-v1.test.mjs`

## Evidence boundary
This is **DOM output contract**, not a completed authenticated browser sweep of every V2/legacy/provider page; dynamic added repeatable rows and connector forms remain pending. Verified tenant-specific sourceRevision/Brain ACK, card and roadmap reload, complete provider refresh, oversized transaction batch, and per-company official CSRD/ESRS legal applicability remain independent mandatory evidence for P0 #4215. A new qualified exact-head visual preview and latest-main Portal DOM must pass separately (older #37908103412 stays FAILED).

## Security admission correction
GitHub Advanced Security reported PR #4242 CodeQL high finding 203 on the **test-only** regex `/<script>/`: uppercase variants were not matched. The test no longer pretends the regexp is an HTML sanitizer; it positively asserts `Unsafe &lt;script&gt;` output from the existing escaped renderer. No production HTML filtering was relaxed. This must pass a newly generated exact-head CodeQL check before protected merge.
