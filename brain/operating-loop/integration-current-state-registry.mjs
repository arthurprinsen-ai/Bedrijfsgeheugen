import { createBg159CurrentStateInput } from './bg159-current-state-adapter.mjs';
import { createGithubCurrentStateInput } from './github-current-state-adapter.mjs';
import { createNetlifyCurrentStateInput } from './netlify-current-state-adapter.mjs';
import { createNotionCurrentStateInput } from './notion-current-state-adapter.mjs';
import { createDataForSeoCurrentStateInput } from './dataforseo-current-state-adapter.mjs';
import { createSupabaseCurrentStateInput } from './supabase-current-state-adapter.mjs';

const adapters=Object.freeze({
  dataforseo:createDataForSeoCurrentStateInput,
  github:createGithubCurrentStateInput,
  make:createBg159CurrentStateInput,
  netlify:createNetlifyCurrentStateInput,
  notion:createNotionCurrentStateInput,
  supabase:createSupabaseCurrentStateInput
});

export function listIntegrationCurrentStateAdapters(){
  return Object.keys(adapters).sort();
}

export function createIntegrationCurrentStateInput(source,input){
  const key=String(source||'').trim().toLowerCase();
  const adapter=adapters[key];
  if(typeof adapter!=='function') throw new TypeError(`Unsupported integration CurrentState source: ${key||'<empty>'}`);
  return adapter(input);
}
