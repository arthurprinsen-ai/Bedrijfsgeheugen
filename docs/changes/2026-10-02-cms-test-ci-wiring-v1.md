# CMS test CI wiring recovery

The CMS website/portal contract existed in the repository but was not part of any GitHub Actions execution list. The repository's own coverage guard correctly blocked unrelated delivery because an unwired committed test is not an effective control.

This change adds only that exact test to the existing canonical Required test full shared suite. No parallel CI owner, bypass, or BEKEND_ROOD exception is introduced.
