const num=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp01=v=>Math.max(0,Math.min(1,num(v)));
const round=v=>Math.round((v+Number.EPSILON)*100)/100;

export function calculateCompanyValue(input={}){
  const expectedValue=num(input.expectedValue);
  const investment=Math.max(0,num(input.investment));
  const actualCost=Math.max(0,num(input.actualCost));
  const realizedValue=num(input.realizedValue);
  const confidence=clamp01(input.confidence);
  const netExpectedValue=expectedValue-investment;
  const monthlyExpected=expectedValue>0?expectedValue/12:0;
  const paybackMonths=monthlyExpected>0?round(investment/monthlyExpected):null;
  return Object.freeze({
    expectedValue,
    investment,
    netExpectedValue,
    paybackMonths,
    actualCost,
    realizedValue,
    realizedProfit:realizedValue-actualCost,
    variance:realizedValue-expectedValue,
    confidence,
    confidenceAdjustedValue:round(expectedValue*confidence-investment),
    currency:String(input.currency||'EUR')
  });
}
