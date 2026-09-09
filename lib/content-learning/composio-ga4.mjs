export function buildGa4ToolRequest({ property, startDate, endDate }) {
  if (!/^properties\/\d+$/.test(String(property || ''))) throw new Error('GA4_PROPERTY_REQUIRED');
  if (!startDate || !endDate) throw new Error('GA4_DATE_RANGE_REQUIRED');
  return {
    tool_slug: 'GOOGLE_ANALYTICS_RUN_REPORT',
    arguments: {
      property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'pagePath' }, { name: 'sessionCampaignName' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'eventCount' }],
      limit: 250000,
      offset: 0,
      keepEmptyRows: false,
    },
  };
}

export function extractGa4Report(payload) {
  const candidates = [payload?.data, payload?.data?.data, payload?.data?.response?.data, payload?.response?.data, payload];
  const report = candidates.find(x => x && Array.isArray(x.dimensionHeaders) && Array.isArray(x.metricHeaders) && Array.isArray(x.rows));
  if (!report) throw new Error('GA4_REPORT_MISSING');
  return report;
}
