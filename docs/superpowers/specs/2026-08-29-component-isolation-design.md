# Website Component Isolation Design — 2026-08-29

## Goal
Make Bedrijfsgeheugen website changes safe by construction. A change to one component — especially the homepage hero video — must not require editing unrelated header, menu, copy, demo, social-proof, CTA or footer code. CI must reject out-of-scope edits and regressions.

## Problem
The current homepage and shared site chrome mix layout, styling, content and media contracts across broad files. This creates unnecessary blast radius: a local UX or media change can unintentionally alter unrelated elements. Recent mobile-menu and hero-media work showed that branch-level success is not enough when the requested change is local but the implementation surface is broad.

## Design principles
1. **One component, one responsibility.** Each component owns only its markup, styles, optional behavior and direct assets.
2. **Stable public interface.** Consumers depend on a small documented contract rather than internal selectors or implementation details.
3. **No cross-component styling.** A component stylesheet may not target another component's internal classes.
4. **No unrelated page rewrites for local work.** Updating hero video source or poster never requires rewriting homepage copy, menu or demo markup.
5. **Exact change scope is executable.** CI determines the declared change class and rejects files outside its allowlist.
6. **Preview before production.** Every material UI/media change receives an exact-SHA deploy preview and component-specific verification.
7. **Last-known-good remains protected.** A red candidate never replaces the verified production state.

## Target structure

```text
components/
  header/
    header.html
    header.css
    header.js
    contract.json
  hero-copy/
    hero-copy.html
    hero-copy.css
    contract.json
  hero-video/
    hero-video.html
    hero-video.css
    hero-video.js
    contract.json
    media.json
  hero-demo/
    hero-demo.html
    hero-demo.css
    contract.json
  social-proof/
    social-proof.html
    social-proof.css
    contract.json
  footer/
    footer.html
    footer.css
    footer.js
    contract.json

pages/
  home.page.json

tools/
  compose-site.mjs
  verify-component-boundaries.mjs
  verify-change-scope.mjs

tests/
  components/
    header.test.mjs
    hero-copy.test.mjs
    hero-video.test.mjs
    hero-demo.test.mjs
    social-proof.test.mjs
    footer.test.mjs
  page-composition.test.mjs
  change-scope.test.mjs
```

The existing static deployment model remains. A small deterministic composer assembles components into deployable HTML before preview/production. This is not a runtime framework migration and introduces no client-side dependency for composition.

## Component contracts
Each `contract.json` defines:
- component id and version;
- owned files and asset paths;
- required root selector/data attribute;
- allowed external design tokens;
- optional JS entry point;
- expected accessibility hooks;
- protected invariants;
- allowed dependent components, normally none.

A component can be understood and tested independently from the rest of the page.

## Hero video component
The hero video receives the strongest isolation because media swaps are frequent and device-sensitive.

### Public interface
`components/hero-video/media.json` is the only normal edit point for a media replacement:

```json
{
  "src": "/assets/hero/hero-v1.mp4",
  "poster": "/assets/hero/hero-v1-poster.webp",
  "type": "video/mp4",
  "autoplay": true,
  "muted": true,
  "playsinline": true,
  "loop": true,
  "preload": "metadata",
  "aspectRatio": "16/9",
  "objectFit": "cover",
  "mobileFallback": "/assets/hero/hero-v1-poster.webp"
}
```

Replacing a video normally changes only:
1. the versioned media asset(s);
2. `components/hero-video/media.json`;
3. a media-specific acceptance record/hash when required.

It must not require edits to homepage text, navigation, hero-demo, social proof or footer.

### Media invariants
The component gate verifies:
- exactly one canonical hero video element;
- local/versioned media source, no accidental external CDN dependency;
- `autoplay`, `muted`, `playsinline` and `loop` when enabled by contract;
- poster/fallback exists;
- fixed aspect ratio prevents layout shift;
- responsive width and object-fit remain valid;
- no audio dependency for autoplay;
- accepted iPhone/Safari media fingerprint when an asset has device-specific acceptance requirements;
- source/hash identity matches the media manifest.

### Failure behavior
If video playback fails, the component falls back to the poster without collapsing the hero or affecting adjacent components. The fallback is local to hero-video.

## Page composition
`pages/home.page.json` declares order only, for example:

```json
{
  "components": [
    "header",
    "hero-copy",
    "hero-video",
    "hero-demo",
    "social-proof",
    "footer"
  ]
}
```

The composer resolves fragments and emits the deployable homepage. It does not rewrite component internals. Composition must be deterministic: same inputs produce byte-equivalent output.

## CSS isolation
Each component uses a unique root attribute, for example `data-bg-component="hero-video"`, with namespaced internal classes. Boundary validation rejects:
- selectors targeting another component root;
- global element rules inside component CSS;
- `!important` except explicitly whitelisted compatibility cases;
- duplicated ownership of the same class or data attribute;
- page-level CSS that reaches into component internals.

Global design tokens remain centralized and are read-only dependencies for components.

## JavaScript isolation
Component JS may query only inside its own component root, except explicit shared infrastructure such as analytics hooks. It may not mutate sibling component DOM. The boundary test scans for known cross-component selectors and requires explicit allowlisting for shared services.

## Change-scope guard
Every PR/candidate declares or derives a change class from changed paths. Examples:

### `hero-video-media`
Allowed:
- `components/hero-video/media.json`
- versioned assets under the hero media path;
- hero-video acceptance metadata/test fixtures where necessary.

Forbidden:
- header/menu files;
- hero-copy;
- hero-demo;
- social-proof;
- footer;
- unrelated page content;
- unrelated shared CSS/JS.

### `header-navigation`
Allowed only in header-owned files and header tests unless the component interface itself changes.

### `component-interface-change`
Broader scope is possible, but must be explicitly classified and must run all dependent component/page-composition tests. This prevents a local request from silently becoming a broad rewrite.

The scope guard fails CI before deploy when the diff exceeds its class.

## Regression strategy
Four layers:

1. **Component contract tests** — markup, accessibility, CSS ownership, JS boundary and required assets.
2. **Composition tests** — component order, unique roots, deterministic assembly and no missing fragments.
3. **Change-scope test** — diff is limited to the declared component/change class.
4. **Runtime preview checks** — exact Netlify preview SHA, responsive smoke checks and device-specific media acceptance where relevant.

A hero-video-only candidate can therefore be validated without changing or retesting implementation details of the menu, while page-level smoke still proves the assembled page remains intact.

## Migration strategy
Migration must preserve the current visible site as the baseline.

### Phase 1 — Freeze baseline
- Record current `main` as migration last-known-good.
- Capture DOM/component snapshots and current routes.
- Do not redesign content or visuals during extraction.

### Phase 2 — Extract without visual changes
Extract one component at a time in this order:
1. header;
2. footer;
3. hero-copy;
4. social-proof;
5. hero-demo;
6. hero-video.

After each extraction, composed output must remain functionally and visually equivalent at protected breakpoints before continuing.

### Phase 3 — Add scope guard
Once ownership is explicit, enable mandatory change-scope validation for automation branches and PRs to `main`.

### Phase 4 — Make hero-video the first isolated change path
Verify that replacing only `media.json` plus the media asset produces a preview where all other component hashes remain unchanged.

## Protected invariants during migration
- All existing routes remain valid.
- Homepage proposition/copy is unchanged unless separately requested.
- Header/menu behavior is unchanged unless separately requested.
- Hero-demo/chat remains unchanged.
- Social-proof remains unchanged.
- Footer remains unchanged.
- Existing analytics/consent behavior remains intact.
- Accessibility does not regress.
- Mobile and desktop layout remain equivalent to the accepted baseline.
- Production remains on last-known-good until exact preview acceptance is green.

## Acceptance criteria
The architecture is complete only when all of the following are machine-proven:
1. Each named component exists as an isolated unit with a contract.
2. Homepage is generated from the component manifest/composer.
3. Boundary test rejects cross-component CSS/JS ownership violations.
4. A synthetic hero-video-only diff touching the header fails the scope guard.
5. A valid hero-video media-only diff passes the scope guard.
6. Component tests and page-composition tests pass.
7. Exact preview deploy is `ready` for the migration candidate.
8. Responsive smoke is green at representative mobile and desktop widths.
9. A real hero-video media swap can be previewed while hashes of header, hero-copy, hero-demo, social-proof and footer remain unchanged.
10. Rollback to the pre-migration last-known-good is documented and tested.

## Rollback
The migration is developed on an isolated branch. Until the composed build is fully accepted, the current static homepage remains last-known-good. If the composed candidate fails visual, functional, route, media or runtime acceptance, production remains or returns to the existing static version. No destructive data migration is involved.

## Operational rule for future agents
When a request names one component, default execution scope is that component only. The agent must not edit other components unless it first proves the interface requires a broader change, reclassifies the task as an interface change, and lets the broader CI suite validate the new scope. A local request may never silently expand its blast radius.

## Reusable lesson
Website reliability improves when ownership boundaries are executable, not merely documented. The desired invariant is: **change the requested component, prove every protected sibling stayed unchanged, then deploy.**
