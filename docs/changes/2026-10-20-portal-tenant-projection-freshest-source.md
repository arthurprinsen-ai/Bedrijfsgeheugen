# Portal tenant projection: nested freshness and end-to-end truth

**Obligation:** `portal|tenant-projection|freshest-nested-merge|20261020` · Parent [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).

## Reproduced code-level defect
The existing Portal V2 reads from the canonical Supabase EU state and composes customer (`legacy-migration`) and canonical Brain (`canonical-brain`) layers. Previously `{...legacy.portal, ...canonical.portal}` replaced entire nested objects whenever one canonical key existed. A canonical `portal.profile` observed before a confirmed edit could therefore revert the customer's later `employees`, even though the edit's canonical BusinessInput acknowledgement had been received. For compliance and model settings, unrelated nested fields were also discarded.

## Scoped change
Existing `composePortalProjectionLayers` now deep-merges `portal` using the canonical BusinessInput answer merger (already tested and used elsewhere), with explicit source revision comparison to choose the last writer for overlapping keys. Preserve intentional false/zero/empty/null; arrays are atomic. Reject different tenant IDs before any composition. Do **not** change the separate Brain authority for signals, recommendations, actions, graph, or forecasts.

## Proved vs unproved
Static regression tests cover newer customer edit, newer Brain revision, explicit empty values, nested field preservation and tenant mismatch. This is a source-code correctness fix; **not** a claim all pages, customer connectors, Google/LinkedIn or predictive financial series now work. The latest audit found missing verified financial forecast series and no outcome linkage on 101 intelligence action candidates; these remain independent blocking obligations.

## Production acceptance
Keep PR under protected Required CI/CodeQL; compare exact current-main to Netlify production release; Chromium test actual authenticated persistence and navigation for two isolated tenants; Supabase readback must show current sourceRevision/Brain ACK and no orphan or stale field. Do not force merge, bypass EU RLS, or synthesize customer figures. The existing parent #4215 remains open until all pages, form fields and sources meet its matrix acceptance.
