# Instagram credential/provider identity dedupe — 2026-09-26

Production had four ACTIVE Composio credentials for the same Instagram provider identity. The publisher counted credentials and failed with `COMPOSIO_INSTAGRAM_CONNECTION_AMBIGUOUS`.

The permanent rule is provider-identity based: every active credential is preflighted against Instagram `/me`; credentials are grouped by the returned provider user id. One unique provider user id is one canonical publishing identity even when several OAuth credentials exist. A deterministic credential is selected. More than one distinct provider user id remains fail-closed.

This prevents duplicate OAuth records from stopping daily publishing without weakening account-isolation safety.
