# P0: prevent re-introduction of dated private blog learning into public Git

The historic security incident established that the canonical blog exporter used to expose draft content and that public PRs could include internal Brain/change/ledger evidence. Protected releases #5074/#5077 enforce service identity and explicit final approval, and #5082 removed the three internal dated blog evidence files from current main. This source safeguard adds explicit ignore patterns for these three classes and an existing security regression that will fail if an October or other dated private blog record reappears under those paths.

The upstream delivery admission originally treated `.gitignore` as unclassified; protected #5085 narrowly classified that exact file as backend while preserving failure for other hidden paths. There is no broad admission bypass, no new scheduler, no new publisher, no weakening of token or content approval rules. Historic GitHub PR diffs are not erased by this change.
