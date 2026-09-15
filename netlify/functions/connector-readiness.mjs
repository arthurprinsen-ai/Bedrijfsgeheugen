import {connectorReadinessFromEnv} from '../../platform/connectors/connector-readiness-state.mjs';

const netlifyEnvGet=key=>globalThis.Netlify?.env?.get?.(key);

export default async () => {
  const readiness=connectorReadinessFromEnv(netlifyEnvGet);
  return new Response(JSON.stringify(readiness), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
};

export const config={path:'/api/connectors/readiness'};
