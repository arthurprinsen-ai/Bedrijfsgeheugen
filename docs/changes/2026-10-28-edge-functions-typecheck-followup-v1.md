# 2026-10-28 — Edge-functies: overige typefouten uit deno check

Obligation: edge-functions-typecheck-20261028.

Vervolg op #5041 (runtime-fouten). Deno check op alle edge-functies liet na #5041 nog 77 typefouten in 17 functies zien. Deze PR maakt `deno check` groen voor elke `supabase/functions/*/index.ts`.

Aanpak: uitsluitend typeringen, geen logica. Op de aanroepplek een cast of annotatie (`as any`, `as string`, `: any`), of een `await`/`filter`-parameter getypt. Waar een gedeelde helper in `_shared/*.mjs` een te strakke parametertype heeft (bijv. `= null` of `never[]`), is die helper niet aangepast; de aanroep is gecast. Zo blijft de wijziging binnen de edge-functies.

Runtime-gedrag is per regel gelijk gehouden. Bewust gecontroleerd:
- `(productionRunId as number)<1` en `(projectionRunId as number)<1`: deze tak wordt alleen bereikt als `Number.isInteger` waar is, dus de vergelijking gebeurt nooit op null.
- `clean(o?.slug)!==slug` in powerhouse-blog-export: deze tak wordt alleen bereikt als `clean(o?.slug)` truthy is, dus `o` is niet null.
- `{ mail_key: r.mail_key, ...(composeTrialMail(...) as any) }` in bg-trial-lifecycle-mail: dezelfde volgorde en dezelfde overschrijving als voorheen.

Regressietest: tests/brain-edge-functions-typecheck-20261028.test.mjs. Draait `deno check` op alle edge-functies wanneer een deno-binary beschikbaar is (DENO_BIN of PATH); anders overgeslagen met reden.
