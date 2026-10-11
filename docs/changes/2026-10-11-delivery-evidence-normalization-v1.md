# POWERHOUSE channel recovery metadata

On 11 October 2026, the canonical content pipeline had retry metadata stored as JSON-encoded strings in a JSONB field. This broke reliable per-channel cooldown selection and repeatedly selected the same failing personal LinkedIn draft.

The production migration adds a caller-privilege trigger to normalize this one existing table field at the write boundary. It preserves all provider side-effect, duplicate publication, authorization, and delivery status metadata. Existing business-day values were normalized without re-sending anything.

Verified Supabase readback: all seven channel evidence values are JSON objects, and the personal LinkedIn retry timestamp is present. This is not proof of public publication. Parent: P0 #4198.
