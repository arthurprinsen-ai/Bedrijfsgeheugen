# Optimizer workflow YAML startup fix — 2026-10-06

The autonomous engineering optimizer could fail before creating any job because its PR-body shell heredoc escaped the YAML block indentation.

The workflow now builds the pull-request body with quoted `printf` arguments. This removes YAML-sensitive column-zero metadata lines while preserving the exact machine-readable delivery metadata.

Regression coverage forbids the broken heredoc shape and requires the safe body builder.
