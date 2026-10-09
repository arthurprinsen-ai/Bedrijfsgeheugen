# Development ledger — canonical public browser no-response recovery

- Parent P0: #4215. Previous protected main: `f40195ba9a0ade14733038ac5b143f364e1f462f`.
- Previous production: Netlify `6ac8871de5df21000801ecb1` READY exact commit; Production Source Snapshot `37892820871` SUCCESS and Production Release Readback `37892820855` SUCCESS.
- Production Portal V2 DOM run `37892901902`: SUCCESS including visual baseline.
- Production canonical website visibility run `37892820886`: FAILURE, three cases `/en/help` (phone context destroyed), `/en/ai-automatisering-mkb` and `/en/ai-ecosysteem` (tablet HTTP no-response).
- Recovery: preserve all browsers/routes, recover a genuine navigation race through one bounded same-URL reload; verify a null navigation by exact browser route + independent HTTP success; never count unverified 403/404 as pass.
- Delivery: exact-head Required + CodeQL, immutable preview, protected merge, exact-main Netlify production release and terminal live readbacks; logged-in tenants and authoritative CSRD legal impact proof remain parent P0 obligations.
