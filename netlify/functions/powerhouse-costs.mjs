import { getUser } from '@netlify/identity';
import { createCostDashboardHandler } from '../../platform/api/cost-dashboard-handler.mjs';
import { createCostProjectionStore } from './_cost-projection-store.mjs';

const handler = createCostDashboardHandler({ getUser, store: createCostProjectionStore() });

export default async request => handler(request);
export const config = { path: '/api/powerhouse-costs' };
