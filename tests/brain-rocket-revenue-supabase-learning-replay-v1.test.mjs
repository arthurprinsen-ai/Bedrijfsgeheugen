// Canonical learning evaluators admit only tests/brain-*.test.mjs paths.
// Import the original Supabase suite unchanged to execute every privacy, attribution,
// consent, deduplication, and provider boundary assertion during replay/shadow/canary.
// Do not replace source tests or restore archived SQL to executable migrations.
import './supabase-powerhouse-rocket-revenue-event-spine-v1.test.mjs';
