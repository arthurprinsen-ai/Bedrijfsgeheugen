# Bedrijfsgeheugen Brain component contracts

The Brain is a logical control architecture over the existing Powerhouse. Stable Make scenarios are not replaced. Each active component has one primary role and one primary authority in `component-registry.json`.

Canonical flow: `Evidence -> Signal -> Opportunity -> Decision -> Mission -> Outcome -> Pattern -> CurrentState`.

Authority rules: verified source evidence outranks inference; observed outcomes outrank predictions; BG166 is append-only event/learning persistence; BG167 is the current shared-state projection; BG168 routes outcomes/learning; BG156 orchestrates missions; BG169 is production authority. Security and hard-boundary gates cannot be overridden by learned scores.

Creative/Prompt Cortex reuses BG09 for creative strategy/narrative/channel allocation, BG14 for observed calibration, BG24 for Mira video/prompt compilation, BG25 for carousel production, BG180 for scene-level outcome learning, and PH Agent 10/15 for calendar execution and post guarding.

Every future active component must declare its Brain contract before production: primary role, cortex, authority, consumed object types, produced object types and `brain.v1` compatibility.
