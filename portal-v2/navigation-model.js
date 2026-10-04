import { listPortalGroups } from './page-registry.js';

const freezePages=pages=>Object.freeze(pages.map(page=>Object.freeze(page)));
const GROUP_ICONS=Object.freeze({
  overzicht:'⌂',
  besturen:'↗',
  realiseren:'✓',
  'data-intelligence':'◫',
  'actueel-externe-data':'☁',
  'continuiteit-risico':'◇',
  beheren:'⚙',
  overig:'▦'
});

function canonicalPages(group){
  const pages=group.pages.map(page=>({id:page.id,label:page.label,target:page.id}));
  if(group.id==='overzicht'){
    pages.splice(1,0,{id:'project',label:'Jouw project',target:'hub:project'});
  }
  return freezePages(pages);
}

/**
 * One navigation authority for Portal V2.
 * Desktop renders this tree in the sidebar; compact/mobile renders the same
 * tree in the responsive drawer. No reduced second menu is maintained.
 */
export const DESKTOP_NAV_GROUPS = Object.freeze(
  listPortalGroups().map(group=>Object.freeze({
    id:group.id,
    label:group.label,
    icon:GROUP_ICONS[group.id]||'•',
    target:group.pages[0]?.id||'overzicht',
    pages:canonicalPages(group)
  }))
);

export const DESKTOP_NAV_ITEMS = Object.freeze(
  DESKTOP_NAV_GROUPS.map(({id,label,icon,target})=>Object.freeze({id,label,icon,target}))
);

/**
 * Compatibility export for callers that still import PORTAL_NAV_ITEMS.
 * It now resolves to the same complete canonical tree rather than a reduced
 * five-item mobile model.
 */
export const PORTAL_NAV_ITEMS = Object.freeze(
  DESKTOP_NAV_GROUPS.flatMap(group=>group.pages.map(page=>Object.freeze({
    id:page.id,
    label:page.label,
    target:page.target,
    groupId:group.id
  })))
);

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
