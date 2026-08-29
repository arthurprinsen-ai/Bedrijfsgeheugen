# Website Component Isolation Design — 2026-08-29

## Goal
Make Bedrijfsgeheugen website changes safe by construction and fast to develop in parallel. A change to one component — especially the homepage hero video — must not require editing unrelated header, menu, copy, demo, social-proof, CTA or footer code. Independent components must be editable, testable and previewable simultaneously by separate agents without shared-file conflicts. CI must reject out-of-scope edits and regressions.

## Problem
The current homepage and shared site chrome mix layout, styling, content and media contracts across broad files. This creates unnecessary blast radius: a local UX or media change can unintentionally alter unrelated elements. It also serializes development because multiple changes converge on the same HTML/CSS files. Recent mobile-menu and hero-media work showed that branch-level success is not enough when the requested change is local but the implementation surface is broad.

## Design principles
1. **One component, one responsibility.** Each component owns only its markup, styles, optional behavior and direct assets.
2. **Stable public interface.** Consumers depend on a small documented contract rather than internal selectors or implementation details.
3. **No cross-component styling.** A component stylesheet may not target another component's internal classes.
4. **No unrelated page rewrites for local work.** Updating hero video source or poster never requires rewriting homepage copy, menu or demo markup.
5. **Exact change scope is executable.** CI determines the declared change class and rejects files outside its allowlist.
6. **Parallel by default where safe.** Independent component work runs in separate branches/worktrees and does not share writable files.
7. **Component preview first.** A local change is tested and previewed at component scope before integration.
8. **Preview before production.** Every material UI/media change receives an exact-SHA deploy preview and component-specific verification.
9. **Last-known-good remains protected.** A red candidate never replaces the verified production state.
10. **Integrator owns composition only.** Component workers do not edit the generated page or each other's component files.

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
  pricing/
    pricing.html
    pricing.css
    pricing.js
    contract.json
  footer/
    footer.html
    footer.css
    footer.js
    contract.json

pages/
  home.page.json

config/
  component-ownership.json
  change-classes.json

tools/
  compose-site.mjs
  compose-component-preview.mjs
  verify-component-boundaries.mjs
  verify-change-scope.mjs
  verify-component-hashes.mjs

tests/
  components/
    header.test.mjs
    hero-copy.test.mjs
    hero-video.test.mjs
    hero-demo.test.mjs
    social-proof.test.mjs
    pricing.test.mjs
    footer.test.mjs
  page-composition.test.mjs
  change-scope.test.mjs
  parallel-ownership.test.mjs
  component-hash-protection.test.mjs
```

The existing static deployment model remains. Small deterministic composers assemble components into deployable HTML for component previews and full-page previews. This is not a runtime framework migration and introduces no client-side dependency for composition.

## Component contracts
Each `contract.json` defines:
- component id and version;
- owned files and asset paths;
- required root selector/data attribute;
- allowed external design tokens;
- optional JS entry point;
- expected accessibility hooks;
- protected invariants;
- allowed dependent components, normally none;
- preview fixture requirements;
- compatibility version for composition.

A component can be understood and tested independently from the rest of the page.

## Parallel development model
The architecture is explicitly designed for simultaneous work.

### Ownership manifest
`config/component-ownership.json` is the machine-readable source of truth for writable scope:

```json
{
  "header": ["components/header/**", "tests/components/header.test.mjs"],
  "hero-copy": ["components/hero-copy/**", "tests/components/hero-copy.test.mjs"],
  "hero-video": ["components/hero-video/**", "assets/hero/**", "tests/components/hero-video.test.mjs"],
  "hero-demo": ["components/hero-demo/**", "tests/components/hero-demo.test.mjs"],
  "social-proof": ["components/social-proof/**", "tests/components/social-proof.test.mjs"],
  "pricing": ["components/pricing/**", "tests/components/pricing.test.mjs"],
  "footer": ["components/footer/**", "tests/components/footer.test.mjs"]
}
```

Shared infrastructure (`tools/**`, `pages/**`, global tokens and CI workflows) is owned by the integrator/architecture lane and is not writable by normal component workers.

### Worktree/branch isolation
Each simultaneous task receives:
- one component id;
- one isolated git branch/worktree;
- a strict writable-path allowlist from the ownership manifest;
- component-specific tests and preview command;
- the component contract and relevant baseline hash.

Example concurrent lanes:

```text
agent/header      -> components/header/**
agent/hero-video  -> components/hero-video/** + assets/hero/**
agent/pricing     -> components/pricing/**
agent/hero-demo   -> components/hero-demo/**
integrator        -> pages/** + tools/** + integration branch
```

Agents must not edit generated output or another component's files. This prevents merge conflicts by construction rather than resolving them after the fact.

### Parallel task eligibility
Tasks may run simultaneously only if:
- they have disjoint ownership scopes;
- neither changes a shared public interface used by the other;
- no task requires output from another unfinished task;
- they do not mutate shared generated artifacts;
- each can be tested against the same accepted component contract baseline.

If an interface changes, the task is reclassified as `component-interface-change` and coordinated by the integrator before dependent component work continues.

## Component preview pipeline
Each component gets a lightweight preview shell generated by `tools/compose-component-preview.mjs`.

Flow:

```text
edit component
  -> component contract test
  -> ownership/scope guard
  -> component preview build
  -> responsive component smoke
  -> component candidate GREEN
```

This pipeline should finish substantially faster than the full website suite and can run concurrently for independent components.

A component preview contains only:
- global read-only design tokens;
- the component under test;
- minimal fixture content required by its contract;
- no unrelated production component markup.

This makes local UX/media verification faster and makes failures attributable to one domain.

## Integration pipeline
The integrator consumes immutable green component candidate SHAs/commits and assembles a full-page candidate.

Flow:

```text
N independent green component candidates
  -> integrate/rebase onto common baseline
  -> verify no ownership overlap
  -> compose full homepage
  -> verify protected sibling hashes
  -> integration tests
  -> full responsive preview
  -> exact-SHA Netlify preview
  -> production gate
```

The integrator never accepts a red component candidate. A component that fails remains isolated while other independent green components may continue through integration when there is no dependency.

## Protected sibling hashes
Before any local component change, CI records hashes for all protected sibling component source trees. For a `hero-video-media` change, for example, the candidate must prove unchanged hashes for:
- header;
- hero-copy;
- hero-demo;
- social-proof;
- pricing;
- footer.

`tools/verify-component-hashes.mjs` compares the base and candidate trees. This gives machine evidence that an isolated change did not silently rewrite unrelated UI.

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

It must not require edits to homepage text, navigation, hero-demo, social proof, pricing or footer.

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
    "pricing",
    "footer"
  ]
}
```

The composer resolves fragments and emits the deployable homepage. It does not rewrite component internals. Composition must be deterministic: same inputs produce byte-equivalent output.

Generated deployable HTML is treated as build output, not as a normal authoring surface. Component agents never edit it directly.

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
- pricing;
- footer;
- unrelated page content;
- unrelated shared CSS/JS.

### `header-navigation`
Allowed only in header-owned files and header tests unless the component interface itself changes.

### `component-interface-change`
Broader scope is possible, but must be explicitly classified and must run all dependent component/page-composition tests. This prevents a local request from silently becoming a broad rewrite.

The scope guard fails CI before deploy when the diff exceeds its class.

## Regression strategy
Five layers:

1. **Component contract tests** — markup, accessibility, CSS ownership, JS boundary and required assets.
2. **Ownership/scope tests** — worker diff remains inside its component allowlist.
3. **Composition tests** — component order, unique roots, deterministic assembly and no missing fragments.
4. **Sibling hash protection** — non-target components remain byte-identical at source level for local change classes.
5. **Runtime preview checks** — component preview first, then exact Netlify integration preview SHA, responsive smoke checks and device-specific media acceptance where relevant.

A hero-video-only candidate can therefore be validated without changing implementation details of the menu, while page-level smoke still proves the assembled page remains intact.

## CI concurrency
Independent component test jobs use a matrix keyed by changed component ids. Only changed components run their expensive component-specific jobs. Shared boundary and composition gates run once on the integration candidate.

Example conceptual matrix:

```text
component-test[header]
component-test[hero-video]
component-test[pricing]
component-test[hero-demo]
```

These jobs execute concurrently. The integrator waits only for the components included in the current integration set.

## Migration strategy
Migration must preserve the current visible site as the baseline.

### Phase 1 — Freeze baseline
- Record current `main` as migration last-known-good.
- Capture DOM/component snapshots and current routes.
- Do not redesign content or visuals during extraction.

### Phase 2 — Establish shared infrastructure
- add global read-only design tokens boundary;
- add component ownership manifest;
- add component contract schema/conventions;
- add deterministic full-page and component-preview composers;
- add scope/boundary/hash validators.

This is the only intentionally shared architectural lane.

### Phase 3 — Extract independent components
After shared infrastructure is green, extraction can be parallelized into disjoint lanes:
- header + footer may run in parallel;
- hero-copy + social-proof + pricing may run in parallel;
- hero-demo + hero-video may run in parallel once their hero layout slots are frozen.

Each extraction must preserve visible and functional behavior. No redesign is bundled into extraction.

### Phase 4 — Enable mandatory parallel ownership gates
Once ownership is explicit, enable mandatory change-scope validation for automation branches and PRs to `main`. Reject overlapping writable scopes for simultaneous workers.

### Phase 5 — Make hero-video the first isolated production change path
Verify that replacing only `media.json` plus the media asset produces a component preview and integration preview where all other component hashes remain unchanged.

## Protected invariants during migration
- All existing routes remain valid.
- Homepage proposition/copy is unchanged unless separately requested.
- Header/menu behavior is unchanged unless separately requested.
- Hero-demo/chat remains unchanged.
- Social-proof remains unchanged.
- Pricing remains unchanged unless separately requested.
- Footer remains unchanged.
- Existing analytics/consent behavior remains intact.
- Accessibility does not regress.
- Mobile and desktop layout remain equivalent to the accepted baseline.
- Production remains on last-known-good until exact preview acceptance is green.
- Independent component workers never write the same source path.

## Acceptance criteria
The architecture is complete only when all of the following are machine-proven:
1. Each named component exists as an isolated unit with a contract.
2. Homepage is generated from the component manifest/composer.
3. Component preview composition works independently from the full page.
4. Boundary test rejects cross-component CSS/JS ownership violations.
5. A synthetic hero-video-only diff touching the header fails the scope guard.
6. A valid hero-video media-only diff passes the scope guard.
7. Parallel ownership test rejects overlapping writable scopes.
8. Component tests can run concurrently for at least three independent components.
9. Component tests and page-composition tests pass.
10. Exact preview deploy is `ready` for the migration candidate.
11. Responsive smoke is green at representative mobile and desktop widths.
12. A real hero-video media swap can be previewed while hashes of header, hero-copy, hero-demo, social-proof, pricing and footer remain unchanged.
13. Two independent component changes can be developed on separate branches/worktrees and integrated without manual source conflict resolution.
14. Rollback to the pre-migration last-known-good is documented and tested.

## Rollback
The migration is developed on isolated branches/worktrees plus an integration branch. Until the composed build is fully accepted, the current static homepage remains last-known-good. If one component candidate fails, that candidate is excluded while unrelated green component work may continue. If the composed candidate fails visual, functional, route, media or runtime acceptance, production remains or returns to the existing static version. No destructive data migration is involved.

## Operational rule for future agents
When a request names one component, default execution scope is that component only. The agent must not edit other components unless it first proves the interface requires a broader change, reclassifies the task as an interface change, and lets the broader CI suite validate the new scope. A local request may never silently expand its blast radius.

When multiple independent requests exist, the coordinator should dispatch one specialized agent per component in parallel. Each agent receives only its component context, contract, writable paths, tests and success criteria. The integrator reviews and combines green results after checking ownership overlap and interface compatibility.

## Reusable lesson
Website reliability and development speed improve when ownership boundaries are executable, not merely documented. The desired invariant is: **change the requested component, prove every protected sibling stayed unchanged, let independent components build in parallel, then integrate and deploy.**
