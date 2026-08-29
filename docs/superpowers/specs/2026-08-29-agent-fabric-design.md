# Bedrijfsgeheugen Agent Fabric Design

## Purpose
Bedrijfsgeheugen agents must behave as one governed operating team: every agent sees the same Business Truth, shared evidence, prior fixes, verified outcomes and active work. Agents may specialize, but they may not maintain independent truths or isolated long-term memories.

## Architectural invariants
- Company Graph + Canonical State remain the only Business Truth.
- All agent coordination is represented as canonical AgentWork and events.
- Learning is shared, governed, evidence-backed and tenant-scoped.
- AI Interpretation never silently becomes Business Truth.
- Execution always goes through policy, autonomy envelope, Change/verification and rollback rules already enforced by Brain Runtime.
- High-risk or high-blast-radius work requires human review.
- Duplicate signals collapse into one active work item.
- A verified learning pattern is reusable by a different specialist agent.
- Agent collaboration may add support agents dynamically based on impacted domains.
- No agent can bypass the shared Brain Gateway, event store, policy engine or audit trail.

## Agent roles
The initial registry defines specialist capabilities, not separate silos: Reliability/Self-Heal, Security, Cost, Performance, Data Quality, Website/UX, SEO/Content, Growth/Market Intelligence, Integration/Make, Governance/AI Act, and Product/Opportunity. Each agent advertises capabilities and domains. One agent is primary owner for each AgentWork item; zero or more support agents are attached when cross-domain impact exists.

## Coordination model
A shared Agent Fabric accepts normalized work signals. It fingerprints the tenant + affected objects + problem/opportunity class to deduplicate open work. The router scores agents by capability/domain match and selects one primary owner and required support agents. AgentWork is then advanced through the existing lifecycle: Detected -> Assigned -> Investigating -> FixPrepared/WaitingApproval -> Executing -> Verifying -> Resolved -> LearningRecorded.

Every state transition emits a canonical coordination event. State changes are immutable from the caller perspective: the Fabric creates a new AgentWork value and stores it in the shared work registry.

## Shared learning
Verified outcomes become LearningRecord objects containing tenant, pattern fingerprint, domains, symptoms, action fingerprint, evidence, verification outcome, impact, confidence and reuse count. Learning is written only after verification. Before planning new work, the Fabric searches tenant-scoped learning for matching fingerprints/domains. Reused learning is attached to AgentWork evidence and increments reuse metadata; it never causes execution by itself.

## Continuous improvement
The Fabric accepts both reactive signals (failures, incidents, regressions) and proactive opportunities (cost reduction, performance, SEO, market, UX, security hardening). Opportunity signals use the same AgentWork lifecycle and governance. Priority is derived from severity/materiality, urgency, expected value, risk and confidence.

A periodic improvement cycle may enqueue opportunities from specialist scanners, but scanners only produce normalized signals. They cannot write Business Truth or execute changes directly.

## Cross-domain impact
Each work item carries affected domains and objects. The router automatically attaches support agents for every material domain. Example: a website change that affects UX, SEO, performance and security is owned once, with those specialists collaborating on the same AgentWork record rather than creating four disconnected tasks.

## Failure and safety behavior
- Unknown agent/capability: fail closed.
- No eligible owner: work remains Detected and requires intervention.
- Duplicate active work: return the existing AgentWork item.
- Conflicting learning: do not auto-select; attach both as evidence and require investigation.
- Learning without verification evidence: reject.
- Cross-tenant learning lookup: forbidden.
- Execution remains delegated to Brain Runtime, preserving current policy/autonomy/verification controls.

## Acceptance criteria
1. Two different specialist agents can collaborate on one AgentWork item.
2. Duplicate signals produce one active work item.
3. A verified learning record produced by one agent is reused by another matching agent.
4. Learning never crosses tenants.
5. A proactive opportunity and a reactive failure use the same governed lifecycle.
6. Cross-domain signals automatically add support agents.
7. No Fabric method can directly execute an external change; it must return work/plan context for Brain Runtime.
8. Existing Brain Acceptance, Trust, Foundation, production AI, legacy parity and shared-agent-memory gates remain green.
