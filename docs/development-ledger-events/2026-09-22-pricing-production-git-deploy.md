# Pricing production Git deploy recovery — 2026-09-22

- Obligation: `pricing-neno-structure-2026-09-22-v1`
- Lane: website
- Candidate: PR #2614
- Root cause: the previous production snapshot path required the ephemeral `NETLIFY_MCP_PROXY_PATH_TEMP` credential, which was absent.
- Action: issue a real `prijzen.html` change on the Netlify-connected Git branch, normalize internal pricing links to canonical full URLs, and merge only after required gates pass.
- Proof required: exact production release identity plus live pricing-content readback. Until then the release remains non-terminal.
