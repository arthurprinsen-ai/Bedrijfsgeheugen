# Development ledger — bounded Portal browser HTTP 403 readback recovery

- Parent: P0 #4215
- Candidate: PR #4229
- Existing main before change: `ee82f942dea7e74a273627a59ce84a6efec547bd`, Netlify production `6ac884214a13c30008fe18bf` READY with exact source
- Failing browser proof: exact-head #4228 preview run `37891722168` reported one demoAI route HTTP 403 (14 passed, 1 skipped), while another same-route mobile test succeeded; canonical production public shell `37891725830` reported four HTTP 403s during 4x2 concurrent public route checks
- Candidate actions: bounded three-attempt retry of temporary response codes in the 24-capability demo hydration browser test, no bypass for sustained denial, and serialized viewport/limited route traffic (2 route workers, 1 viewport) for public production shell checks
- No data, authorization, redirect, website copy, or customer runtime modifications
- Admission: protected Required + CodeQL and actual immutable preview; merge/readback only when provider and browser evidence is green
- Authentic two-tenant customer writes and official CSRD/ESRS impact applicability remain open separately on #4215
