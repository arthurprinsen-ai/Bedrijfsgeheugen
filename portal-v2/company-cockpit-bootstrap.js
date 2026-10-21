import {ensureIdentityWidget} from './portal-state.js?bg_explain=80ad881b4217977c9eb4684228d3191e5631c0f2c0e4dce43f4a956ba895387a';
import {mountCompanyCockpit} from './company-cockpit-ui.js?bg_explain=80ad881b4217977c9eb4684228d3191e5631c0f2c0e4dce43f4a956ba895387a';

let controller=null;
let mounting=null;

function ensureStyles(documentRef){
 if(!documentRef||documentRef.querySelector('link[data-company-cockpit]'))return;
 const link=documentRef.createElement('link');link.rel='stylesheet';link.href='./company-cockpit.css?bg_explain=80ad881b4217977c9eb4684228d3191e5631c0f2c0e4dce43f4a956ba895387a';link.dataset.companyCockpit='true';documentRef.head.appendChild(link);
}

async function authHeaders(identity){
 try{
  const user=identity?.currentUser?.();const token=await user?.jwt?.();
  return token?{authorization:`Bearer ${token}`}:{ };
 }catch{return {};}
}

export function mountAuthenticatedCompanyCockpit(documentRef=globalThis.document){
 if(controller)return Promise.resolve(controller);
 if(mounting)return mounting;
 ensureStyles(documentRef);
 mounting=ensureIdentityWidget().then(identity=>{
  const stateClient={authHeaders:()=>authHeaders(identity)};
  controller=mountCompanyCockpit({documentRef,stateClient});
  identity?.on?.('login',()=>controller?.refresh?.());
  identity?.on?.('logout',()=>controller?.refresh?.());
  return controller;
 }).finally(()=>{mounting=null;});
 return mounting;
}
