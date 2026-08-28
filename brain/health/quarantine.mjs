export function quarantine(record,reason){return {record,reason,quarantined_at:new Date().toISOString(),replayable:true,active_for_decisions:false}}
