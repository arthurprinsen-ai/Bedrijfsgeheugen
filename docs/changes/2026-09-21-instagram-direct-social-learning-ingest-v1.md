# Direct Instagram -> canonical social learning ingest

Date: 21 September 2026  
Fingerprint: `instagram-direct-social-learning-ingest-v1`

## Problem

The Composio primary Instagram path could publish and verify a Mira Reel without creating the corresponding `social_posts` row. That row was historically created by `bg-buffer-sync`, so an open Buffer rate-limit circuit created a data-spine gap even though Instagram provider truth was green.

## Repair

`powerhouse-social-publisher` now performs the social ingest immediately after provider-verified Composio publication. The write is idempotent on `tenant_id, platform, external_post_id`, preserves the frozen daily winner, normalizes the winner format to Reel, stores the final caption hash and channel identity, and runs `bg_content_lessen` after the write.

Buffer remains useful for Buffer-owned posts and subsequent measurements. It is no longer an authority or prerequisite for learning from direct Instagram publication.

## Recovery

The existing `powerhouse-content-closed-loop-v1` cron runs every five minutes and already invokes both the canonical publisher and `bg-buffer-sync`. While the Buffer circuit is open, sync exits without provider calls; after `retry_at` the same loop resumes it automatically. No extra retry cron or duplicate writer is introduced.
