# Netlify control-plane early-trigger convergence v2

## Problem

The shared Netlify applicability classifier correctly marked `tools/ci/**` as governance-only, but Production Source Snapshot and Production Release Readback still started on such main pushes because their push-level `paths-ignore` lists did not include `tools/ci/**`.

On merge `e902e07fef8b3411451280072b40f0d0aac24bb8`, snapshot run `37478237193` and release-readback run `37478237085` both allocated runners before concluding that Netlify deployment was not applicable.

## Fix

Both production workflows now ignore `tools/ci/**` at trigger admission. Their in-job shared applicability authority remains unchanged and fail-closed for mixed/runtime changes.

The Skill Projection issue that was bundled in retired #3961 is not replayed here: it is already merged and post-merge proven green through #3956 / main `441fe997aedeb3016a72e6b2689d2a124dfd3a9a`.
