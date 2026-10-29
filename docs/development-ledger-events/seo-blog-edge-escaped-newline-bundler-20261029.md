# SEO Edge invalid escaped newline — technical recovery ledger

- Source lineage: #5097 merged on main `f5cbbddcfee403a625f91e71e08cc4d7d94795c2`.
- Native Supabase provider rejected function bundling at source line 102 (`ExpectedUnicodeEscape`), where a literal backslash-n appeared between PostgREST filter method calls.
- Production remained at its previously working version 100; failed new deploy was not represented as live.
- Recovery: one exact source byte correction, source-level positive/negative regression, protected PR and subsequent provider deployment parity.
- No secret, blog draft, private customer content, migration history, approval, third-party recipient or scheduler changed.
- Preserve P0 #5072 and #3742 as independent incident authorities.
