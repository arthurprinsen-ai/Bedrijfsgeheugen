import {CONNECTOR_PORTAL_PAGES} from '../assets/js/koppelingen/portal-routing.js';
// Read-only tenant evidence from the original /api/connectors store; never use a browser cache
// as business data and never substitute synthetic safe-test fields for real source records.
const allowed=new Set(CONNECTOR_PORTAL_PAGES.map(page=>page.id));
const text=(node,value)=>{node.textContent=String(value??'');};
export async function mountConnectedDataSources(container,{pageId,fetchFn=globalThis.fetch}={}){
 if(!container||!allowed.has(pageId)||typeof fetchFn!=='function')return null;
 const panel=document.createElement('section');panel.className='pvmodule bg-connected-sources';
 panel.setAttribute('aria-label','Gegevens uit gekozen koppelingen');
 panel.style.cssText='margin:1rem 0;padding:1rem;border:1px solid #ccd5e2;border-radius:16px;background:#f7faff';
 const heading=document.createElement('h3');text(heading,'Gekoppelde gegevens voor deze pagina');
 const intro=document.createElement('p');text(intro,'Broninstellingen en bewijs. Echte cijfers verschijnen alleen na aantoonbare opslag en gecontroleerde verwerking.');
 panel.append(heading,intro);container.append(panel);
 try{
   const response=await fetchFn('/api/connectors/page-sources?page='+encodeURIComponent(pageId),{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
   if(!panel.isConnected)return null;
   if(!response.ok)throw new Error('SOURCE_READBACK_UNAVAILABLE');
   const payload=await response.json();
   if(payload?.truth!=='CONNECTOR_METADATA_ONLY_NO_LIVE_DATA'||payload?.pageId!==pageId||!Array.isArray(payload.items))throw new Error('SOURCE_PROJECTION_INVALID');
   if(!payload.items.length){panel.remove();return null;}
   const list=document.createElement('ul');list.style.cssText='list-style:none;padding:0;display:grid;gap:.6rem';
   for(const item of payload.items.slice(0,25)){
     const li=document.createElement('li');li.style.cssText='padding:.8rem;border:1px solid #dce3ed;border-radius:10px;background:white';
     const name=document.createElement('strong');text(name,item.label||'Koppeling');
     const state=document.createElement('p');text(state,'Status: '+(item.state==='Active'?'Configuratie actief':item.state==='Paused'?'Gepauzeerd':'Nog niet actief')+' · Bron: '+(item.sourceType||'onbekend'));
     const fields=document.createElement('p');text(fields,'Geselecteerde gegevens: '+(Array.isArray(item.fields)&&item.fields.length?item.fields.join(', '):'nog geen selectie'));
     const noValues=document.createElement('p');text(noValues,'Echte gegevens: nog niet geverifieerd of geladen op deze pagina.');
     li.append(name,state,fields,noValues);list.append(li);
   }
   panel.append(list);
   return panel;
 }catch{
   if(panel.isConnected)text(intro,'Koppelingsstatus tijdelijk niet beschikbaar. Er worden geen gegevens of cijfers aangenomen.');
   return panel;
 }
}
