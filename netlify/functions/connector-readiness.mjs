import {createConnectorRuntime,createEnvironmentConnectorProviders} from '../../platform/connectors/connector-runtime.mjs';

export default async () => {
  const engine = createConnectorRuntime({providers:createEnvironmentConnectorProviders()});
  return new Response(JSON.stringify(engine.readiness), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
};

export const config={path:'/api/connectors/readiness'};
