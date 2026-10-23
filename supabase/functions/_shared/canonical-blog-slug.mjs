// Canonical identity for both the original Supabase blog queue and exporter.
// Never silently change an explicit approved SEO slug.
const VALID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function canonicalBlogSlug(explicitSlug,title,date) {
  const explicit=String(explicitSlug??'').trim();
  if(explicit) return VALID.test(explicit) ? explicit : null;
  const generated=String(title??'').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'').slice(0,70).replace(/-+$/g,'');
  const candidate=generated||('powerhouse-'+String(date??''));
  return VALID.test(candidate) ? candidate : null;
}
