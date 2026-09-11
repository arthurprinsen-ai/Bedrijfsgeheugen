import {selectTopPriorities, selectApprovalNeeded, selectBlocked, selectValueLeakage} from './company-decisions.js';

const items = slice => Array.isArray(slice?.items) ? slice.items : [];

export function buildCompanyCockpit(runtime = {}) {
  const priorities = selectTopPriorities(runtime);
  const approvals = selectApprovalNeeded(runtime);
  const blocked = selectBlocked(runtime);
  const timeline = items(runtime.timeline);
  const economics = runtime.economics || {expectedValue:0, actualCost:0, realizedValue:0, realizedProfit:0, currency:'EUR'};
  const now = Array.isArray(runtime?.portfolio?.NOW) ? runtime.portfolio.NOW : [];

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
      { key: 'blocked', title: 'Geblokkeerd', items: blocked },
      { key: 'audit', title: 'Wie deed wat', items: timeline }
    ]
  };
}
