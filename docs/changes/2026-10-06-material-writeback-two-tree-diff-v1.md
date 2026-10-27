# Material writeback guard: shallow-safe two-tree diff

## Problem

Required preflight checks out bounded history and may fetch the immutable PR base as an independent shallow commit. The material writeback closure guard used a three-dot diff, which requires Git to discover a merge base. That made a valid candidate fail before closure evidence was evaluated.

## Structural fix

The guard now compares the exact base and head trees directly with `git diff --name-only <base> <head>`. Changed-path classification needs tree identity, not ancestry. A regression creates two commits with deliberately no merge base and proves the guard still derives the correct changed paths.

This keeps preflight shallow and fast; it does not solve the issue by unshallowing the whole repository.
