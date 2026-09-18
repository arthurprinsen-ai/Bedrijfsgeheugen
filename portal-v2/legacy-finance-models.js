const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const freeze=value=>Object.freeze(value);

export function calculateLegacyFinanceModels(state={}){
 const metrics=state?.portal?.metrics||{};
 const finance=state?.portal?.valueFinance||{};
 const equity=number(finance.equity);
 const balance=number(finance.balance);
 const debtorDays=number(metrics.dso);
 const inventoryDays=number(metrics.inventoryDays);
 const creditorDays=number(metrics.creditorDays);
 return freeze({
  solvency:balance>0?equity/balance*100:0,
  'working-capital-days':debtorDays+inventoryDays-creditorDays,
  'working-capital-evidence':freeze({
    debtorDays,inventoryDays,creditorDays,
    complete:Number.isFinite(Number(metrics.inventoryDays))&&Number.isFinite(Number(metrics.creditorDays)),
    legacyMinimumEvidence:debtorDays>0
  })
 });
}

export const LEGACY_FINANCE_MODEL_IDS=freeze(['solvency','working-capital-days']);
