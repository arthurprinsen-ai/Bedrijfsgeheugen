# 2026-09-22 — Composio production secret runtime reload

Purpose: trigger one normal protected main deployment after rotation of the production `COMPOSIO_API_KEY`, so the existing Netlify Functions runtime reloads the updated secret and the already-live `deploySucceeded` Composio sync executes.

No application logic changes.
No secret values stored.
No publication authority changes.
