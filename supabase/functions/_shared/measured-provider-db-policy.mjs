/** Narrow read-only authority for owned-brand social measurement in the
 * existing Powerhouse content orchestrator's SQL adapter. */
export const MEASURED_SOURCE_TABLES=Object.freeze(['social_posts','social_metric_snapshots']);
export function assertMeasurementSourceReadOnly(table,operation){
  if(MEASURED_SOURCE_TABLES.includes(table)&&operation!=='select')
    throw new Error('DB_SOCIAL_MEASUREMENT_READ_ONLY:'+table);
  return true;
}
export function assertObservedSnapshotFloor(table,column,value){
  if(table!=='social_metric_snapshots'||column!=='observed_at')
    throw new Error('DB_MEASUREMENT_GTE_SCOPE_REJECTED');
  if(typeof value!=='string'||!/^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(?:\\.\\d+)?Z$/.test(value)||
     !Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value.slice(0,10))
    throw new Error('DB_MEASUREMENT_GTE_TIMESTAMP_INVALID');
  return value;
}
