# English language switch runtime repair

Fingerprint: `global-i18n-english-switch-runtime-resilience-v1`

The menu control itself was working, but the translation execution path could fail before any visible text changed. The implementation previously expected Anthropic to return a bare JSON array for every batch and treated a single failed batch as fatal for the whole page.

The runtime now keeps English selected, preserves successful batches, isolates individual failures, uses smaller batches, and starts with a clean v2 browser cache. The server-side parser also accepts JSON arrays wrapped in a JSON code fence or surrounding text.

This means clicking English no longer depends on every translation batch succeeding perfectly before any page text can change.
