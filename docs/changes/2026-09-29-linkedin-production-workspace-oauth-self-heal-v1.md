# LinkedIn production workspace OAuth self-heal

On 29 September 2026 the ChatGPT Composio connection was successfully reauthorized, but the autonomous Supabase publisher still reported zero healthy LinkedIn accounts. The two runtimes were using different Composio credential/workspace lineages.

The production LinkedIn setup controller now owns OAuth repair. Its `create_link` action creates the Connect Link using the same `COMPOSIO_API_KEY` that the Supabase publisher uses. After authorization, `resume` revalidates provider health and invokes the canonical social publisher for the same Amsterdam-day claim.

This prevents a healthy chat connector from being mistaken for a healthy production publisher and preserves the single-writer/no-duplicate contract.
