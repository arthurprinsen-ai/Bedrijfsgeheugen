export const PORTAL_NAV_ITEMS = Object.freeze([
  Object.freeze({ id:'overview', label:'Overzicht', target:'overzicht' }),
  Object.freeze({ id:'portal', label:'Portaal', target:'hub:portal' }),
  Object.freeze({ id:'data-ai', label:'Data & AI', target:'hub:data-ai' }),
  Object.freeze({ id:'tasks', label:'Taken', target:'hub:tasks' }),
  Object.freeze({ id:'more', label:'Meer', target:'hub:more' })
]);

export const DESKTOP_NAV_ITEMS = Object.freeze([
  Object.freeze({ id:'overview', target:'overzicht' }),
  Object.freeze({ id:'csrd-impact', target:'csrd-impact' }),
  Object.freeze({ id:'health', target:'profiel' }),
  Object.freeze({ id:'strategy', target:'strategie-naar-maandagochtend' }),
  Object.freeze({ id:'processes', target:'profiel' }),
  Object.freeze({ id:'knowledge', target:'documenten' }),
  Object.freeze({ id:'data', target:'koppelingen' }),
  Object.freeze({ id:'ai', target:'brain-verwerking' }),
  Object.freeze({ id:'actions', target:'actieve-acties' }),
  Object.freeze({ id:'reports', target:'audit' })
]);

export function mobileTarget(id){
  return PORTAL_NAV_ITEMS.find(item=>item.id===id)?.target || null;
}

export function navigationUrl(target, base=globalThis.location?.href || 'https://www.bedrijfsgeheugen.nl/portal-v2/'){
  const url=new URL(base);
  url.searchParams.delete('page');
  url.searchParams.delete('hub');
  if(target?.startsWith('hub:')) url.searchParams.set('hub',target.slice(4));
  else if(target && target!=='overzicht') url.searchParams.set('page',target);
  return `${url.pathname}${url.search}${url.hash}`;
}
