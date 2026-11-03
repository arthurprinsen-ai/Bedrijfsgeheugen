# 2026-11-03 — Original LinkedIn Sales Machine comment drafts OpenAI-only
Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Owner explicit AI-provider decision: OpenAI exclusively; existing external SalesRobot remains an authorized channel transport, NOT an AI inference provider.

Original Supabase powerhouse-linkedin-sales-machine v27, ACTIVE, and GitHub main exact source use Anthropic API and ANTHROPIC_API_KEY for model-generated comments. They query canonical approved supabase-bg-native-content-generate-v4 which is actually OpenAI gpt-5-mini and then wrongly assert provider Anthropic. This provider/governance drift fails closed and blocks original comment drafts.

Protected source candidate changes the ORIGINAL model call and Vault name to OpenAI Chat Completions, using the already-approved model id. It retains original source-scoped response length and anti-sales-pitch checks, immutable provider receipt requirements, duplicate suppression, original x-powerhouse-token, sender consent and suggested-only comments. A generated comment is never delivered status, a SalesRobot inbox receipt remains independent. No parallel agent, no new cron, no secret migration.

Required: exact-head Required/BRAIN/CodeQL, original safe merge, Supabase Edge exact source deploy and original authorized provider readback. Do NOT mark GREEN merely because source contains OpenAI. Dedicated comment use-case governance separation and external privacy review remain due if existing content use case is insufficiently scoped. Original domain skill updated.
