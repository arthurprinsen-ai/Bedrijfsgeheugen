# Terminal user handoff + Dashboard writeback v1

Date: 2026-09-25  
Fingerprint: `delivery|terminal-user-handoff|dashboard-writeback|v1`

## Problem
A technically correct progress report can still be operationally wrong when it ends on pending CI/auto-merge/readback and leaves the user to infer the next step. That transfers delivery ownership back to the user before the Powerhouse obligation is terminal.

## Contract
Material Powerhouse work now stays owned by the executing/recovering node until protected merge/promotion, production/provider readback, outcome, learning/prevention, relevant skill projection and Powerhouse dashboard/current-state registration are complete.

The normal terminal user answer states what is already proven and durably registered. It never returns a new autonomous TODO list. Only an evidenced `BLOCKED_HARD_BOUNDARY` may require a human action.

## Dashboard projection
The same closure is projected into the existing Dashboard Hub, Canonical System Map / Agent Update Contract, Latest Verified State and Agent Activity Log surfaces. Notion remains a human-readable projection; runtime/GitHub/provider evidence stays authoritative.

## Regression
`tests/brain-terminal-user-handoff-dashboard-writeback-v1.test.mjs` fails closed if policy, AGENTS or the continuity skill lose this contract.
