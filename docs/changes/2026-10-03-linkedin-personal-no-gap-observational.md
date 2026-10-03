# LinkedIn personal daily no-gap recovery

On 3 October 2026 the personal LinkedIn obligation stopped at `SKIPPED / NO_ELIGIBLE_CONTENT`. The scheduler itself was active. The failure came from contradictory fallback semantics: legacy recovery reused an older personal artifact, while the current personal-channel policy correctly rejects previously consumed story families.

The recovery aligns the whole chain. Historical personal artifacts are no longer used as cadence fillers. If no genuinely unused verified personal event exists, Powerhouse can select a fresh, source-backed everyday-life theme and write it as an observation without `ik/mijn/mij/me`, without pretending Arthur experienced it and without a business bridge.

The orchestrator now reopens a personal `SKIPPED / NO_ELIGIBLE_CONTENT` state when a compliant new source exists. The pre-publish review and social publisher understand the same observational truth mode, while semantic duplicate/story-family protection stays fail-closed.

Provider routing is also deterministic: the personal LinkedIn path prefers the canonical personal connection independently from company/org connections and still verifies Arthur's LinkedIn member identity before write.

The five-minute closed loop remains the execution authority. A day is only considered published after a new provider-side publication acknowledgement/readback exists; a content skip is not treated as a successful daily post.
