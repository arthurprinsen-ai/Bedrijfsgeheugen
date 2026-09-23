# Pricing controls interaction recovery — 2026-09-23

## Problem

On the pricing page, the controls for **Ik wil eerst weten wat nodig is / Ik wil continu sturen**, **Maandelijks / Jaarlijks**, and the lifecycle routes could render as buttons without reliably changing the visible state. The billing row was also visually pulled upward by a negative margin.

## Root cause

The page relied on one direct-listener initialization path for several separate stateful control groups. That made the interaction surface unnecessarily fragile: if later page/runtime work interfered with that initialization or with the stacking order, the controls could still look clickable while no state transition happened. There was no delegated fallback path that could recover the click/tap interaction. The negative billing margin also caused the alignment defect visible in the screenshots.

## Fix

The pricing page now has an independent delegated capture-phase interaction guard for:
- the price-direction tabs;
- monthly/yearly billing;
- lifecycle phase tabs;
- data-refresh buttons.

The guard keeps visual state and accessibility state together through `aria-selected`, `aria-pressed`, `hidden` and keyboard tab navigation. Billing changes also update recurring price text and the checkout `billing` query parameter. Interactive groups are explicitly isolated above surrounding layers, and the billing row is returned to normal-flow spacing.

## Prevention

A pricing control is not considered functional because it renders. Its acceptance contract requires an observable state transition: the selected state changes, the corresponding panel/card changes, billing prices change where relevant, and the downstream checkout URL receives the selected billing period. Stateful controls should use resilient delegated interaction handling and normal-flow layout rather than fragile negative offsets.

## Production acceptance

After merge, production `/prijzen` must expose the candidate source and the release chain must complete. Functional browser verification must cover desktop and mobile interaction for all four control groups before the change is treated as terminal.
