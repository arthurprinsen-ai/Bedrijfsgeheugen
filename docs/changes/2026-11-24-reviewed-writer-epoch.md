# Reviewed writer execution epoch — isolated review candidate

Status: reference validator only, no runtime authority. Original #4661 owner retains integration and protected deployment. No competing change to #5940.

The v6 runner requires current PR base and current main to equal the reviewed manifest expectedBase. A separately approved manifest merged into main changes main. The proposed pure validator separates reviewed source, exact original PR head/base and protected execution epoch. It verifies source digests, scope, ancestry, identity and rechecks main. It always returns writeAuthorized:false.

Run: node --test tests/brain-writer-reviewed-epoch.test.mjs. Fourteen local synthetic tests passed before repository staging. Native CI and actual provider integration are unproven.

Before enabling any new route, bind both policy and manifest bytes to trusted protected checkout, verify native ancestry and original obligation/owner, acquire original fenced lease, verify again before expected-head CAS, and build and independently validate complete two-parent merge tree and actual scope for overlapping changes. No new scheduler, no allowed path changes, no workflow or existing writer change. Require protected review, Required, CodeQL, BRAIN, provider readback and outcome proof. The original writer continues to fail closed until then.

Source incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661#issuecomment-7142713623
