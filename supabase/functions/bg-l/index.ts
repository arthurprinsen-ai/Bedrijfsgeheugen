import { createClient } from 'npm:@supabase/supabase-js@2';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

Deno.serve(async (req: Request) => {
  const u = new URL(req.url);
  const sleutel = (u.searchParams.get('s') || '').trim().slice(0, 64);
  const pad = (u.searchParams.get('p') || '/frisse-blik').replace(/[^a-zA-Z0-9\/_-]/g, '');
  const doel = 'https://www.bedrijfsgeheugen.nl' + (pad.startsWith('/') ? pad : '/' + pad);
  if (!sleutel || !/^[A-Za-z0-9_-]{4,64}$/.test(sleutel)) return json({error:'ONGELDIGE_SLEUTEL'},400);

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({error:'SERVER_CONFIG'},500);

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // Campaign links have their own registry; do not require a private contact key.
  const { data: campagne, error: campagneFout } = await client.from('bg_campaign_links')
    .select('destination,campaign_key,status,expires_at').eq('key', sleutel).maybeSingle();
  if (campagneFout) return json({ error: 'CAMPAGNE_LOOKUP_MISLUKT' }, 500);
  if (campagne) {
    const verlopen = campagne.expires_at && new Date(campagne.expires_at).getTime() <= Date.now();
    if (campagne.status !== 'active' || verlopen) return json({ error: 'CAMPAGNE_NIET_ACTIEF' }, 410);
    let bestemming: URL;
    try {
      bestemming = new URL(campagne.destination);
      if (bestemming.protocol !== 'https:' ||
          !['bedrijfsgeheugen.nl', 'www.bedrijfsgeheugen.nl'].includes(bestemming.hostname) ||
          bestemming.port || bestemming.username || bestemming.password ||
          !bestemming.pathname.startsWith('/')) throw new Error('INVALID_CAMPAIGN_DESTINATION');
    } catch {
      return json({ error: 'ONGELDIGE_CAMPAGNE_BESTEMMING' }, 500);
    }
    // Anonymous campaign attribution; never collect contact identity in this path.
    const linkedin = sleutel.startsWith('li-company-');
    bestemming.searchParams.set('utm_source', linkedin ? 'linkedin' : 'bedrijfsgeheugen');
    bestemming.searchParams.set('utm_medium', linkedin ? 'organic_social' : 'campaign_link');
    bestemming.searchParams.set('utm_campaign', campagne.campaign_key);
    bestemming.searchParams.set('utm_content', sleutel);
    return new Response(null, {
      status: 302,
      headers: { location: bestemming.toString(), 'cache-control': 'no-store, max-age=0',
                 'referrer-policy': 'no-referrer' }
    });
  }

  const { data: connectie, error } = await client.from('bg_connecties').select('sleutel').eq('sleutel', sleutel).maybeSingle();
  if (error) return json({error:'SLEUTEL_LOOKUP_MISLUKT'},500);
  if (!connectie) return json({error:'SLEUTEL_NIET_GEVONDEN'},404);

  const { data, error: rpcError } = await client.rpc('bg_klik_vastleggen', { p_sleutel: sleutel, p_doel: doel });
  if (rpcError) return json({error:'ATTRIBUTIE_MISLUKT'},500);
  const eind = typeof data === 'string' && data.startsWith('https://www.bedrijfsgeheugen.nl/') ? data : doel;
  return new Response(null, { status: 302, headers: { location: eind, 'cache-control': 'no-store, max-age=0' } });
});
