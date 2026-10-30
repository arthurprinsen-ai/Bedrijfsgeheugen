/* Existing canonical CMS evidence only. This is NOT a software release approval gate. */
export function cmsReviewStatus(items, {generatedAt=null}={}){
 if(!Array.isArray(items))return Object.freeze({status:'UNAVAILABLE',total:null,draft:null,published:null,archived:null,portalDraft:null,portalPublished:null,generatedAt:null,releaseApproved:false});
 const valid=items.filter(item=>item&&typeof item==='object'&&
  ['portal','shared','website'].includes(item.surface)&&
  ['draft','published','archived'].includes(item.status));
 if(valid.length!==items.length)return Object.freeze({status:'UNAVAILABLE',total:null,draft:null,published:null,archived:null,portalDraft:null,portalPublished:null,generatedAt:null,releaseApproved:false});
 const count=status=>valid.filter(item=>item.status===status).length;
 const portal=valid.filter(item=>item.surface==='portal'||item.surface==='shared');
 const portalCount=status=>portal.filter(item=>item.status===status).length;
 const draft=count('draft'),published=count('published'),portalDraft=portalCount('draft'),portalPublished=portalCount('published');
 return Object.freeze({
  status:!generatedAt?'UNAVAILABLE':portalPublished===0?'PORTAL_CONTENT_NOT_PUBLISHED':portalDraft>0?'PORTAL_CONTENT_REVIEW_PENDING':'PORTAL_CONTENT_PUBLISHED',
  total:valid.length,draft,published,archived:count('archived'),portalDraft,portalPublished,
  generatedAt:generatedAt||null,
  releaseApproved:false // CMS statuses do not approve GitHub/Netlify code releases.
 });
}
