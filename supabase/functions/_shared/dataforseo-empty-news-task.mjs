// DataForSEO v3 may return overall 20000 with task 40101 or 40102 for "No Search Results".
// These are empty successful SERPs, not healthy source evidence and not provider faults.
// Preserve a strict top-level success gate and fail closed on other task statuses.
export function isDataForSeoEmptyNewsTask({httpOk,envelopeCode,taskCode}={}) {
  return httpOk===true && Number(envelopeCode)===20000 && [40101,40102].includes(Number(taskCode));
}
