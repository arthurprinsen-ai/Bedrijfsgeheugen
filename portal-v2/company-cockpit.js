import {selectTopPriorities, selectApprovalNeeded, selectBlocked, selectValueLeakage} from './company-decisions.js?bg_explain=80ad881b4217977c9eb4684228d3191e5631c0f2c0e4dce43f4a956ba895387a';

const items = slice => Array.isArray(slice?.items) ? slice.items : [];

export function buildCompanyCockpit(runtime = {}) {
  const priorities = selectTopPriorities(runtime);
  const approvals = selectApprovalNeeded(runtime);
  const blocked = selectBlocked(runtime);
  const timeline = items(runtime.timeline);
  const economics = {expectedValue:null, actualCost:null, realizedValue:null, realizedProfit:null, currency:'EUR', ...(runtime.economics || {})};
  const now = Array.isArray(runtime?.portfolio?.NOW) ? runtime.portfolio.NOW : [];
  const verifiedValueByProblem = Array.isArray(runtime?.verifiedValueByProblem) ? runtime.verifiedValueByProblem : [];

  return {
    sections: [
      {
        key: 'company-now',
        title: 'Bedrijf nu',
        data: {
          activePriorities: now.length,
          pendingApprovals: approvals.length,
          blocked: blocked.length,
          valueLeakage: selectValueLeakage(runtime)
        },
        items: now
      },
      { key: 'priorities', title: 'Wat moet eerst', items: priorities },
      { key: 'approvals', title: 'Goedkeuring nodig', items: approvals },
      { key: 'economics', title: 'Kosten en opbrengst', data: economics, items: [] },
      { key: 'verified-value', title: 'Verified Value Created', items: verifiedValueByProblem },
      { key: 'blocked', title: 'Geblokkeerd', items: blocked },
      { key: 'audit', title: 'Wie deed wat', items: timeline }
    ]
  };
}
