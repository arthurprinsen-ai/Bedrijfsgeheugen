# Production promotion recovery for pricing

The pricing release is already merged. The remaining issue is deployment transport: the repository's source snapshot workflow ran on main push but skipped its authorized Netlify deployment because those steps accepted only manual dispatch.

This change restores the intended protected-main path. A push that changes this workflow will package exact source, invoke the existing authorized Netlify transport, then require the live release marker to expose the same SHA before success.
