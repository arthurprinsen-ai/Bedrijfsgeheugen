# Restore content RPC authentication and exact verifier classification

A receiver-dependent SQL call accidentally entered standalone directRpc during the query-client injection change. Its caught error produced a null token and the existing auth guard returned401. Restore only that RPC executor to directSql; keep transaction-bound DirectQuery clients and all auth/permission/allowlist checks unchanged. Actual RPC execution now has a regression, including denied RPC names. Production token equality was checked without exposing the token.

The terminalizer also rejected tools/content-growth/reviewed-blog-refresh.mjs as unknown runtime. Classify only this exact CI authorization utility in the existing verifierOnlyPaths contract. Edge, renderer and unknown helper paths retain their runtime/readback requirements. No generic prefix or production gate is weakened.

Acceptance: current successor exact BRAIN/Required/CodeQL/native preview, protected merge, native source parity and canonical authenticated blog-generation smoke, then same blog5042 publication. Original5046 auth failure remains historical; its source is immutable and its terminalizer is not falsely reported green. Existing Mira candidate9tKLfiIGtJj9HYlZLRGs failed true start-frame face0.92<0.94 after560 credits; no identical generation or verification retry and no fake approval. Personal LinkedIn readback still requires actual provider permission; no resend.

Plan: RED real standalone RPC and classification, scoped GREEN, full current backend and Brain checks, independent whole-branch review, protected current successor, native smoke and same daily writer. No new publisher/scheduler or ad-hoc publication-table edits.

Independent successor review: no critical/important findings;34 relevant tests passed independently, diff clean. Current full backend passes. No source mutation to historical5046.
