# Netlify production build parity — 25 September 2026

A production-linked Netlify build for `66f5051e…` failed with build exit code 2 even though GitHub website checks had been green.

The mismatch was structural: the GitHub website lane used a reduced local composer and skipped production-critical stages from `netlify.toml`, including pricing build capture/restore and static i18n generation.

The website lane now contains a dedicated `netlify-build-parity` job that executes the complete Netlify production build chain before merge with deterministic production-like i18n settings.

This prevents a candidate from being called release-ready when GitHub has never actually built what Netlify will build.
