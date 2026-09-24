# 2026-09-24 — pricing visible-state regression contract

Observed BRAIN failures on PR #2725:
- pricing page keeps mobile controls clickable and exposes monthly/yearly billing
- pricing direction tabs change visible plan groups
- lifecycle tabs hide every non-selected panel

All three failures were stale regex expectations for the former `hidden = selector !== key` implementation.

Updated tests now require the complete active/inactive visible-state tuple and preserve the stronger runtime fix.
