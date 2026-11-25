export function classifyRootItem(item, requiredHubs) {
  const title=String(item?.title||'').trim();
  if (!title) return 'quarantine';
  if (requiredHubs.includes(title)) return 'canonical-hub';
  return 'review';
}

export function evaluateRootBudget({titles,rootCount,maxRootItems,requiredHubs}) {
  const present=new Set(titles);
  const missingHubs=requiredHubs.filter(title=>!present.has(title));
  const overBudget=rootCount>maxRootItems;
  return {ok:missingHubs.length===0&&!overBudget,missingHubs,overBudget,rootCount,maxRootItems};
}
