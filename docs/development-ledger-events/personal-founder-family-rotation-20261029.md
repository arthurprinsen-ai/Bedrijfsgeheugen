# Founder source-family recovery

2026-10-29: Existing personal reserve is date/kind keyed. Different independently observed event types could not create a new recommendation after the same date/kind ID was rejected. Exact same event family MUST stay idempotent. The protected patch adds a source-family suffix to the existing reserve dedupe/content keys; original provider/semantic duplicate checks remain independent. No new scheduler, publisher, claim reset or private contents. A post is not claimed live without provider proof.
