function clean(value){return String(value||'').trim()}
export function customerInitials(value=''){
 const words=clean(value).split(/\s+/).filter(Boolean);
 if(!words.length)return'BG';
 if(words.length===1)return words[0].slice(0,2).toUpperCase();
 return `${words[0][0]||''}${words.at(-1)[0]||''}`.toUpperCase()||'BG';
}

export function deriveCustomerBrand(state={},user=null){
 const company=state?.company||{};
 const portalBrand=company?.portalBrand||{};
 const customerName=clean(portalBrand.name||company.name||company.naam||'Bedrijfsgeheugen');
 const userName=clean(user?.user_metadata?.full_name||user?.userMetadata?.full_name||user?.name||user?.email||'Gebruiker');
 return Object.freeze({
  customerName,
  customerInitials:customerInitials(customerName),
  userName,
  userInitials:customerInitials(userName),
  role:clean(state?.user?.role||user?.app_metadata?.role||user?.appMetadata?.role||'Gebruiker')
 });
}

export function applyCustomerBranding({state={},user=null,root=globalThis.document}={}){
 if(!root)return deriveCustomerBrand(state,user);
 const brand=deriveCustomerBrand(state,user);
 const brandNode=root.querySelector('.brand');
 if(brandNode){
  let label=brandNode.querySelector('[data-customer-brand-label]');
  if(!label){label=root.createElement('span');label.dataset.customerBrandLabel='true';const nodes=[...brandNode.childNodes].filter(n=>n.nodeType===3);nodes.forEach(n=>n.remove());brandNode.appendChild(label)}
  label.textContent=brand.customerName;
 }
 const avatar=root.querySelector('.profile .avatar');if(avatar)avatar.textContent=brand.userInitials;
 const profileName=root.querySelector('.profile strong');if(profileName)profileName.textContent=brand.userName;
 const profileRole=root.querySelector('.profile small');if(profileRole)profileRole.textContent=brand.role||'Gebruiker';
 const welcome=root.querySelector('.welcome h1');if(welcome)welcome.textContent=`Welkom terug, ${brand.userName.split(/\s+/)[0]||'daar'}`;
 root.documentElement?.setAttribute('data-customer-brand',brand.customerName);
 return brand;
}
