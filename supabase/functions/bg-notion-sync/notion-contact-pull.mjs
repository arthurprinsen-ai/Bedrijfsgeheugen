import { CORE_ID, project, mergedExtra } from "./notion-contact-projection.mjs";

// Reuse the existing canonical hourly Notion owner; no webhook setup or second scheduler.
export const CONTACT_PULL_PAGE_SIZE = 50;
export const CONTACT_PULL_MAX_PAGES = 3;

export function projectedBatch(pages) {
  const result = new Map();
  let rejected = 0;
  for (const page of pages || []) {
    const item = project(page);
    if (!item) { rejected++; continue; }
    const prior = result.get(item.linkedin_url);
    if (!prior || prior.metadata.modified_at < item.metadata.modified_at) result.set(item.linkedin_url, item);
  }
  return { items: [...result.values()], rejected };
}

async function projectPageToExistingCRM(db, pages) {
  const { items, rejected } = projectedBatch(pages);
  if (!items.length) return { scanned: pages.length, matched: 0, updated: 0, rejected, missing: 0, conflicts: 0 };
  const urls = items.map(i => i.linkedin_url);
  const { data: existing, error } = await db.from("bg_connecties")
    .select("sleutel,linkedin_url,extra,bijgewerkt_op").in("linkedin_url", urls);
  if (error) throw new Error("NOTION_CONTACT_CRM_READ_FAILED:" + error.message);
  const grouped = new Map();
  for (const row of existing || []) {
    const rows = grouped.get(row.linkedin_url) || [];
    rows.push(row);
    grouped.set(row.linkedin_url, rows);
  }
  let matched = 0, updated = 0, missing = 0, conflicts = 0;
  // Serial optimistic writes: deterministic, no temporary rows or whole-record upserts.
  for (const item of items) {
    const rows = grouped.get(item.linkedin_url) || [];
    if (rows.length === 0) { missing++; continue; }
    if (rows.length !== 1) { conflicts++; continue; }
    const row = rows[0];
    matched++;
    const next = mergedExtra(row.extra, item.metadata);
    if (!next) continue;
    let query = db.from("bg_connecties").update({
      extra: next, bijgewerkt_op: new Date().toISOString()
    }).eq("sleutel", row.sleutel);
    if (row.bijgewerkt_op) query = query.eq("bijgewerkt_op", row.bijgewerkt_op);
    else query = query.is("bijgewerkt_op", null);
    const { data: saved, error: writeError } = await query.select("sleutel");
    if (writeError) throw new Error("NOTION_CONTACT_CRM_UPDATE_FAILED:" + writeError.message);
    if (saved?.length === 1) updated++;
    else conflicts++;
  }
  return { scanned: pages.length, matched, updated, rejected, missing, conflicts };
}

export async function pullNotionContacts(db, notionToken, notionRequest, limits = {}) {
  const pagesPerRun = Math.max(1, Math.min(CONTACT_PULL_MAX_PAGES, Number(limits.pages) || CONTACT_PULL_MAX_PAGES));
  const pageSize = Math.max(1, Math.min(CONTACT_PULL_PAGE_SIZE, Number(limits.pageSize) || CONTACT_PULL_PAGE_SIZE));
  const { data: saved, error: cursorError } = await db.from("bg_notion_contact_pull_state")
    .select("source_id,next_cursor,pages_processed,contacts_updated").eq("source_id", CORE_ID).maybeSingle();
  if (cursorError) throw new Error("NOTION_CONTACT_CURSOR_READ_FAILED:" + cursorError.message);
  let cursor = saved?.next_cursor || null;
  let cycleComplete = false;
  const stats = { scanned: 0, matched: 0, updated: 0, rejected: 0, missing: 0, conflicts: 0, pages: 0 };
  for (let n = 0; n < pagesPerRun; n++) {
    const input = { page_size: pageSize, sorts: [{ timestamp: "last_edited_time", direction: "descending" }] };
    if (cursor) input.start_cursor = cursor;
    const page = await notionRequest(notionToken, "/data_sources/" + CORE_ID + "/query", {
      method: "POST", body: JSON.stringify(input)
    });
    if (!Array.isArray(page.results)) throw new Error("NOTION_CONTACT_PAGE_INVALID");
    const step = await projectPageToExistingCRM(db, page.results);
    for (const key of ["scanned","matched","updated","rejected","missing","conflicts"]) stats[key] += step[key];
    stats.pages++;
    const nextCursor = page.has_more ? page.next_cursor : null;
    if (page.has_more && (!nextCursor || nextCursor === cursor)) throw new Error("NOTION_CONTACT_CURSOR_INVALID");
    cursor = nextCursor;
    cycleComplete = !page.has_more;
    // Checkpoint after each successful page, not only at the end: retries never fabricate sends.
    const { error: writeCursorError } = await db.from("bg_notion_contact_pull_state").upsert({
      source_id: CORE_ID,
      next_cursor: cursor,
      cycle_completed_at: cycleComplete ? new Date().toISOString() : (saved?.cycle_completed_at || null),
      last_success_at: new Date().toISOString(),
      pages_processed: Number(saved?.pages_processed || 0) + stats.pages,
      contacts_updated: Number(saved?.contacts_updated || 0) + stats.updated,
      updated_at: new Date().toISOString()
    }, { onConflict: "source_id" });
    if (writeCursorError) throw new Error("NOTION_CONTACT_CURSOR_WRITE_FAILED:" + writeCursorError.message);
    if (cycleComplete) break;
  }
  return {
    source: CORE_ID, ...stats, cycle_complete: cycleComplete,
    next_cursor_present: Boolean(cursor), did_send_messages: false
  };
}
