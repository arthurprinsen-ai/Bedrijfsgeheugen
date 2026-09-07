# UI Visual Regression Guard — Design

Date: 2026-09-07
Status: proposed
Scope: Bedrijfsgeheugen website release chain

## Problem

The homepage automation section reached production with a visual collision: a large product visual covered the section heading and explanatory copy. The immediate section-level fix is live, but the failure class remains possible elsewhere. Static HTML/CSS checks and ordinary functional tests are insufficient because the defect only becomes visible after layout, runtime scripts, fonts, responsive breakpoints, and late-injected UI have all executed in a browser.

The same class includes:

- content and visuals overlapping;
- CTA, heading or paragraph becoming partially hidden;
- absolute/fixed/transformed elements escaping their intended container;
- contrast becoming unreadable during interaction;
- layout shifts caused by late injection or hydration;
- responsive layouts that are valid at desktop but broken at tablet/mobile widths;
- interactive states that are readable at rest but broken after drag/toggle/open actions.

## Goal

No website change may be promoted to production when a protected page contains a material visual collision, hidden primary content, excessive layout shift, or an interactive state that makes required copy unreadable.

The protection must be generic, deterministic, evidence-producing, and part of the existing website/release lane rather than a one-off homepage patch.

## Non-goals

- Pixel-perfect screenshot equality across browsers.
- Blocking harmless sub-pixel movement or animation.
- Replacing accessibility, SEO, functional or content tests.
- Requiring manual screenshot approval for every release.

## Recommended architecture

Use three independent gates, each catching a different failure mode.

### 1. Static layout contract

Add a repository-level contract for protected content/visual sections. It should reject known-dangerous patterns when they appear in protected section markup or generated output without an explicit exemption.

Examples:

- product/illustration branch positioned `absolute` relative to a copy-heavy section without a bounded container contract;
- visual branch translated outside its own grid/flex track;
- late runtime injection of a second hero or large block into a section that already owns the primary copy;
- primary copy placed behind a lower z-index or clipping ancestor;
- layout-critical element missing width/min-width/overflow constraints needed for responsive flow.

This is a fast pre-browser gate. It should not attempt to prove that the page looks correct; it only blocks structural patterns that have already produced incidents.

### 2. Browser geometry + CLS gate

Add a Playwright/browser test that loads the built or deploy-preview site and validates protected pages at representative viewports:

- 390×844 — phone;
- 768×1024 — tablet;
- 1024×768 — small desktop/tablet landscape;
- 1440×900 — desktop.

For each protected section the browser collector records `getBoundingClientRect()` for required semantic elements and tests:

- required headings, paragraphs and primary CTAs have non-zero visible area;
- no protected copy rectangle has a material intersection with its sibling visual rectangle;
- no required element is clipped outside the viewport or its declared content container;
- computed opacity/visibility/display do not hide required content;
- effective text/background contrast remains above the chosen contract where the state is testable;
- cumulative layout shift stays below the release threshold after the page reaches a stable state.

Recommended thresholds:

- protected copy/visual intersection: 0 px² permitted, except declared overlays such as badges/handles;
- visible ratio of required copy/CTA: >= 0.98;
- CLS release threshold: <= 0.10 globally, with stricter per-section diagnostics for known late-injection regions;
- no horizontal document overflow greater than 1 CSS pixel at protected viewports.

The collector waits for fonts, network-idle/known app readiness, and a short stability window before measurement. It must also record late layout shifts observed during that window.

### 3. Production readback gate

After production deployment, run the same geometry collector against `https://www.bedrijfsgeheugen.nl` for the critical page set. This catches differences caused by production-only assets, redirects, headers, runtime data, cached scripts, or deployment composition.

A production readback failure must create a failed release outcome and block any claim that the release is healthy. Where the existing delivery system supports rollback/promotion authority, the failure should feed that mechanism rather than remain an informational warning.

## Protected page model

Create a small machine-readable registry, for example `config/ui-visual-regression.json`.

Each page entry defines:

- route;
- criticality;
- viewports to test;
- required text/CTA anchors;
- protected section anchors;
- permitted overlay relationships;
- optional interactions to execute before measuring;
- CLS threshold override only when justified.

Initial critical routes should include:

- `/`;
- `/prijzen`;
- `/due-diligence`;
- major registered money pages;
- customer-portal public entry/marketing route(s) where applicable.

The registry should support discovery from the commercial/SEO page registry later, but v1 should stay explicit so a missing or newly added critical page cannot silently inherit the wrong contract.

## Interaction-state testing

Static screenshots are not enough. A protected entry may define actions such as:

- toggle Platform/Expertise;
- drag comparison divider to 25%, 50% and 75%;
- open accordion/menu;
- activate a product/automation state.

After each action, run the same visibility, intersection, overflow and contrast checks. The exact interaction scripts must be deterministic and use stable selectors/data attributes rather than visible copy when possible.

## Evidence

Every browser run should emit a machine-readable JSON artifact containing:

- commit/deploy SHA;
- route;
- viewport;
- measured rectangles;
- intersection areas;
- visible ratios;
- CLS value and shift entries;
- failed rule IDs;
- screenshot path for failures;
- interaction state when failure occurred.

On failure, also store one screenshot per failing route/viewport/state. Screenshots are diagnostic evidence, not the pass/fail oracle.

## Release-chain integration

Add a dedicated website-lane check, e.g. `UI visual regression`, and wire it into the same protected release path as the existing canonical shell, SEO, required test and live readback checks.

Expected flow:

1. Build canonical output.
2. Run static layout contract.
3. Deploy preview.
4. Run browser geometry/CLS tests against preview.
5. Only after all required checks pass, merge/promote.
6. Deploy production exact SHA.
7. Run production geometry/CLS readback.
8. Publish success only when production readback is green.

The check should be path-aware so documentation-only changes do not launch browsers unnecessarily, while any change to HTML, CSS, JS, site generators, shell tooling, page registry, visual assets that influence layout, or relevant workflows activates the gate.

## Failure semantics

Fail closed for:

- missing protected selector/anchor;
- browser unable to load a protected route;
- required interaction cannot execute;
- measurement collector crashes;
- protected element hidden or materially overlapped;
- CLS above threshold;
- unexpected horizontal overflow.

A missing selector must not be treated as “nothing to test”; otherwise a page rewrite could accidentally delete the guard target and pass.

## Exemptions

Any intentional overlap must be explicit in the registry with:

- rule ID;
- selector pair;
- reason;
- maximum permitted intersection;
- owner;
- expiry/review date.

No blanket page-level exemption.

## Implementation boundaries

Proposed new/changed components:

- `config/ui-visual-regression.json` — protected routes and contracts;
- `tools/ui-visual-regression/contract.mjs` — schema/registry validation;
- `tools/ui-visual-regression/browser-check.mjs` — Playwright geometry + CLS collector;
- `tools/ui-visual-regression/report.mjs` — evidence/report serialization;
- `tests/ui-visual-regression-*.test.mjs` — unit/regression tests;
- `.github/workflows/ui-visual-regression.yml` — preview gate;
- production readback integration in the existing live readback/promotion chain or a dedicated workflow feeding the same production authority;
- `config/brain-delivery-system.json` — classify the new guard under the website conflict/release contract so later edits cannot bypass the website lane.

The current section-specific `fix-homepage-automation-layout` remains useful as the concrete layout fix, but the new guard is independent of that implementation and must detect equivalent failures on other pages.

## Test strategy

TDD should begin with synthetic broken fixtures that reproduce the exact failure classes:

1. visual absolutely overlays heading — must fail;
2. visual remains in separate grid column — must pass;
3. desktop passes but 390 px viewport overlaps — must fail;
4. late script inserts a block causing CLS > 0.10 — must fail;
5. required heading removed — must fail closed;
6. comparison interaction produces unreadable/covered text — must fail after action;
7. intentional badge overlay declared in registry — must pass within allowance;
8. horizontal overflow introduced by transform — must fail.

Then run the collector against the real homepage as a regression fixture before enabling it as a required release check.

## Rollout

Phase 1: homepage + `/prijzen` + `/due-diligence`, four viewports, visibility/intersection/overflow/CLS, failure screenshots.

Phase 2: all registered money pages and high-traffic public pages, interaction states for known interactive components.

Phase 3: automatic registry coverage audit so newly registered commercial pages cannot be added without either a visual-regression contract or an explicit non-critical classification.

## Success criteria

The design is complete when implementation can demonstrate all of the following:

- the exact 2026-09-07 homepage overlap fixture fails before the fix and passes after it;
- a mobile-only version of the same defect is caught;
- a late-injection CLS regression is caught;
- the gate runs on website-impacting PRs and blocks merge when red;
- the production exact SHA is rechecked after deploy;
- evidence identifies route, viewport, rule and offending element pair without manual debugging;
- newly added critical pages cannot silently escape coverage.

## Design decisions

- Geometry/semantic assertions are the primary oracle; screenshot diffing is diagnostic only. This avoids brittle failures from harmless antialiasing and rendering variance.
- CLS is measured in a real browser because static source analysis cannot detect late runtime shifts.
- Production readback is mandatory because preview success cannot prove production composition.
- Critical routes fail closed on missing anchors.
- The guard is generic and registry-driven; no future one-off page-specific visual gate should be needed for this failure class.
