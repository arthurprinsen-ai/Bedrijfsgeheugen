import { createClient } from 'npm:@supabase/supabase-js@2';
import { validateIntake } from '../_shared/benchmark-intake.mjs';

const C = 'bg-benchmark-intake-v1';
const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const cors = {
  'access-control-allow-origin': ORIGIN,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'vary': 'Origin',
};
const J = (b: unknown, n = 200) => new Response(JSON.stringify(b), { status: n, headers: { ...cors, 'content-type': 'application/json', 'cache-control': 'no-store' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return J({ ok: false, contract: C, error: 'POST_ONLY' }, 405);
  if (req.headers.get('origin') !== ORIGIN) return J({ ok: false, contract: C, error: 'ORIGIN_NOT_ALLOWED' }, 403);
  let body: unknown;
  try { body = await req.json(); } catch { return J({ ok: false, contract: C, error: 'JSON_INVALID' }, 400); }
  const v = validateIntake(body);
  if (!v.ok) return J({ ok: false, contract: C, error: v.error }, 400);
  const url = Deno.env.get('SUPABASE_URL') || '', role = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !role) return J({ ok: false, contract: C, error: 'CONFIG' }, 500);
  const db = createClient(url, role, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.from('benchmark_anoniem_inzendingen').insert(v.row);
  if (error) return J({ ok: false, contract: C, error: 'INSERT_FAILED' }, 500);
  return J({ ok: true, contract: C });
});
