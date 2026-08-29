import { createAgentRegistry } from './agent-registry.mjs';

export const DEFAULT_AGENT_TEAM = Object.freeze([
  Object.freeze({ id:'agent-reliability', domains:['Reliability','Operations'], capabilities:['analyze','diagnose','recover','verify'] }),
  Object.freeze({ id:'agent-security', domains:['Security','Trust'], capabilities:['analyze','audit','harden','verify'] }),
  Object.freeze({ id:'agent-cost', domains:['Cost','Operations'], capabilities:['analyze','optimize','measure','verify'] }),
  Object.freeze({ id:'agent-performance', domains:['Performance','Website','Operations'], capabilities:['analyze','optimize','measure','verify'] }),
  Object.freeze({ id:'agent-data-quality', domains:['Data','Data Quality'], capabilities:['analyze','reconcile','validate','verify'] }),
  Object.freeze({ id:'agent-website-ux', domains:['Website','UX'], capabilities:['analyze','design','optimize','verify'] }),
  Object.freeze({ id:'agent-seo-content', domains:['Website','SEO','Content'], capabilities:['analyze','optimize','create','verify'] }),
  Object.freeze({ id:'agent-growth-market', domains:['Growth','Market','Commercial'], capabilities:['analyze','research','experiment','measure'] }),
  Object.freeze({ id:'agent-integration-make', domains:['Integration','Make','Automation'], capabilities:['analyze','integrate','recover','optimize'] }),
  Object.freeze({ id:'agent-governance-ai-act', domains:['Governance','AI Act','Trust'], capabilities:['analyze','audit','govern','verify'] }),
  Object.freeze({ id:'agent-product-opportunity', domains:['Product','Opportunity','Strategy'], capabilities:['analyze','prioritize','experiment','measure'] }),
]);

export function createDefaultAgentRegistry() {
  return createAgentRegistry(DEFAULT_AGENT_TEAM);
}
