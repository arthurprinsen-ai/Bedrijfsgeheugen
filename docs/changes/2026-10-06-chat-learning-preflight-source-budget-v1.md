# Chat-learning preflight source budget — 2026-10-06

The canonical learning graph reached 97 small sources while the preflight still enforced a fixed 96-source ceiling. The independent serialized packet limit of 256 KB remained unbreached.

This change makes both budgets explicit in the chat-learning contract: at most 128 source files and at most 256 KB serialized context. The byte budget remains the primary size boundary; the source-count budget remains a filesystem-fanout safety guard.

The preflight still fails closed if either configured limit is exceeded, and explicit test overrides continue to work.
