# iPhone Runtime Evidence Probe Design

## Goal
Prove the device-specific hero-video runtime state on the immutable Netlify preview itself, without depending on the broken local `chrome-devtools` wrapper and without exposing or changing secrets, credentials, permissions or security controls.

## Scope
The probe is preview-only instrumentation for `/prototype-v18-stable.html`. It activates only when the URL contains `bg-runtime-probe=1`. With no query flag it must be inert and invisible. It must not modify hero playback behavior, media source, canonical V18 controller, navigation, production data or external resources.

## Architecture
A focused static module `assets/runtime-evidence-probe.js` observes `#heroBackgroundVideo` and records deterministic playback evidence. The V18 build script injects one deferred script tag referencing that module. The module exposes the current immutable evidence object at `window.__BG_RUNTIME_EVIDENCE__` and, only in probe mode, a small diagnostics panel with a copy button.

The probe observes `loadedmetadata`, `canplay`, `playing`, `pause`, `waiting`, `stalled`, `error`, `ended` and periodic `timeupdate`/sampling data. It records page URL, user agent, viewport, video source, `currentTime`, `readyState`, `networkState`, paused/ended state and event timestamps. It never calls `play()`, `pause()`, changes `playbackRate`, swaps media, changes opacity or touches the canonical controller.

## Deterministic verdict
The verdict begins as `PENDING`.

`PASS` requires all of the following in one probe session:
- target video exists;
- at least one `playing` event has occurred;
- observed `currentTime` advances by at least 5.0 seconds from the first playing sample;
- no `error` event is observed;
- no terminal stall condition remains after the observation window.

`FAIL` is set when the video emits `error`, the video element is missing, or after 12 seconds from first `playing` the clock has advanced less than 5 seconds. `waiting`/`stalled` events are recorded but do not by themselves fail if playback subsequently advances enough.

## Evidence contract
`window.__BG_RUNTIME_EVIDENCE__` contains:
- `schemaVersion: 1`
- `probe: "hero-video-runtime"`
- `verdict: "PENDING" | "PASS" | "FAIL"`
- `pageUrl`
- `userAgent`
- `viewport`
- `source`
- `startedAt`, `updatedAt`
- `firstPlayingTime`, `maxCurrentTime`, `advanceSeconds`
- `videoState` (`currentTime`, `readyState`, `networkState`, `paused`, `ended`)
- `events[]` with bounded event history
- `failureReason` when failed

Event history is capped at 80 entries to avoid unbounded memory growth.

## Security and privacy
The probe performs no outbound network request and persists nothing. It does not include cookies, localStorage, sessionStorage, credentials, referrers, DOM text or personal data beyond the browser user-agent and viewport needed to identify the device execution context. This avoids creating a public ingestion endpoint or exposing the existing BG151 webhook URL.

## Release behavior
A green Netlify build remains insufficient for this incident. The exact immutable preview SHA must be opened on the affected iPhone with `?bg-runtime-probe=1`, and the resulting evidence must show `PASS`. Only that exact candidate SHA can then enter the existing production-promotion gate. Until an authenticated server-side evidence transport exists, the evidence object is locally observable/copyable rather than automatically submitted; this deliberately preserves the hard security boundary.

## Regression gates
Automated tests must prove:
1. the probe asset exists and contains the expected schema/verdict contract;
2. it is gated by `bg-runtime-probe=1`;
3. it never calls or assigns `play`, `pause`, `playbackRate`, `defaultPlaybackRate`, `src`, `poster` or hero opacity;
4. it caps event history;
5. generated V18 HTML includes exactly one deferred probe script;
6. the canonical V18 controller remains byte-identical;
7. existing V18 preview tests still pass.

## Rollback
Remove the single injected probe script reference and asset. No production state, data or credentials need rollback because the probe is static, opt-in and non-persistent.