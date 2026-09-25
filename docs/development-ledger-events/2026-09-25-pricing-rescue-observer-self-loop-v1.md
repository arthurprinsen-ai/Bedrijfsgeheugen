# 2026-09-25 — pricing rescue observer self-loop v1

Observed:
- production HTML contained `data-bg-stage="loss"`;
- production HTML contained the inline `ready-v3` assignment;
- production HTML loaded `pricing-interactions-rescue-v1.js`;
- independent Playwright could not observe `ready-v3` and the renderer became unresponsive.

Cause:
- whole-body childList observer;
- `syncFromDom()` modifies text nodes;
- own mutations recursively schedule `syncFromDom()`.

Action:
- restrict repair scheduling to newly added relevant pricing elements;
- preserve all existing click/touch/keyboard behavior;
- keep canonical production browser proof as terminal oracle.
