export const CORE_ID = "3b2da36a-ac8a-80f1-a78d-000b4766fd4c";
export function textProperty(p) {
  if (!p) return null;
  if (p.type === "url") return p.url || null;
  if (p.type === "select") return p.select?.name || null;
  if (p.type === "number") return Number.isFinite(p.number) ? p.number : null;
  if (p.type === "checkbox") return p.checkbox === true;
  if (p.type === "title" || p.type === "rich_text") return (p[p.type] || []).map(x => x.plain_text || x.text?.content || "").join("").trim() || null;
  return null;
}
export function normalizedLinkedin(raw) {
  if (typeof raw !== "string") return null;
  try {
    const v = new URL(raw.trim());
    if (v.protocol !== "https:" || !["linkedin.com", "www.linkedin.com"].includes(v.hostname.toLowerCase())) return null;
    const path = v.pathname.replace(/\/+$/, "");
    if (!/^\/in\/[a-z0-9][\w.%-]*$/i.test(path)) return null;
    return "https://www.linkedin.com" + path;
  } catch { return null; }
}
export function project(page) {
  if (!page || page.object !== "page" || page.parent?.type !== "data_source_id" || page.parent.data_source_id !== CORE_ID || page.archived || page.in_trash) return null;
  const p = page.properties || {};
  const linkedin_url = normalizedLinkedin(textProperty(p.LinkedIn));
  if (!linkedin_url || !page.id || !page.last_edited_time) return null;
  return { linkedin_url, metadata: { source: "notion_connecties_kern", page_id: page.id, modified_at: page.last_edited_time, contactbeleid: textProperty(p.Contactbeleid), kanaal: textProperty(p.Kanaal), goedgekeurd: textProperty(p["Tekst goedgekeurd"]) === true, intentiescore: textProperty(p.Intentiescore), datavertrouwen: textProperty(p.Datavertrouwen), can_send: false } };
}
export function mergedExtra(existing, next) {
  const e = existing && typeof existing === "object" && !Array.isArray(existing) ? existing : {};
  const old = e.notion_contact_context;
  if (old && old.page_id !== next.page_id) return null;
  if (old && old.modified_at >= next.modified_at) return null;
  return { ...e, notion_contact_context: next };
}
