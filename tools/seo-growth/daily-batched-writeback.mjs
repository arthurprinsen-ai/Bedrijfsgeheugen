/**
 * In-memory write coalescing for one EXISTING Netlify scheduled Growth Intelligence run.
 * No scheduler, queue, shadow database, durable authority or background executor.
 * Successful completion requires a confirmed PostgREST flush before the handler returns.
 */
export function createGrowthDailyBatch({upsert,patch,maxRows=40}={}){
  if(typeof upsert!=='function'||typeof patch!=='function')throw new Error('GROWTH_DAILY_BATCH_ADAPTER_REQUIRED');
  if(!Number.isInteger(maxRows)||maxRows<1||maxRows>100)throw new Error('GROWTH_DAILY_BATCH_LIMIT_INVALID');
  const writes=new Map(),patches=new Map();
  let flushed=false,flushPromise=null;
  const ensureOpen=()=>{if(flushed)throw new Error('GROWTH_DAILY_BATCH_ALREADY_FLUSHED');};
  function queueUpsert(table,row,onConflict){
    ensureOpen();
    if(!row||typeof row!=='object'||Array.isArray(row)||!table||!onConflict)throw new Error('GROWTH_DAILY_BATCH_INVALID_ROW');
    const cols=onConflict.split(',').map(s=>s.trim()).filter(Boolean);
    if(!cols.length||cols.some(k=>row[k]===null||row[k]===undefined||row[k]===''))throw new Error('GROWTH_DAILY_BATCH_IDENTITY_MISSING');
    const group=table+'|'+onConflict;
    if(!writes.has(group))writes.set(group,{table,onConflict,rows:new Map()});
    writes.get(group).rows.set(JSON.stringify(cols.map(k=>row[k])),row);
    return Promise.resolve();
  }
  function queuePatch(table,query,row){
    ensureOpen();
    if(!table||!query||!row||typeof row!=='object')throw new Error('GROWTH_DAILY_BATCH_INVALID_PATCH');
    patches.set(table+'?'+query,{table,query,row});
    return Promise.resolve();
  }
  async function flush(){
    if(flushPromise)return flushPromise;
    flushed=true;
    // Parallelize independent tables, sequence each table's bounded batches.
    const jobs=[...writes.values()].map(async group=>{
      const items=[...group.rows.values()];
      for(let i=0;i<items.length;i+=maxRows){
        await upsert(group.table,items.slice(i,i+maxRows),group.onConflict);
      }
      return {table:group.table,count:items.length};
    });
    // Existing review/obligation patches are bounded; no overlapping writes to the same query.
    const perTablePatch=new Map();
    for(const change of patches.values()){
      if(!perTablePatch.has(change.table))perTablePatch.set(change.table,[]);
      perTablePatch.get(change.table).push(change);
    }
    for(const items of perTablePatch.values()){
      jobs.push((async()=>{
        for(const item of items)await patch(item.table,item.query,item.row);
        return {table:items[0]?.table||'unknown',count:items.length};
      })());
    }
    flushPromise=Promise.all(jobs).then(groups=>({
      flushed:true,
      rows:groups.reduce((sum,g)=>sum+g.count,0),
      batches:groups.length,
      tableGroups:groups.map(g=>({table:g.table,count:g.count}))
    }));
    return flushPromise;
  }
  return {queueUpsert,queuePatch,flush,pendingCount:()=>[...writes.values()].reduce((n,g)=>n+g.rows.size,0)+patches.size};
}
