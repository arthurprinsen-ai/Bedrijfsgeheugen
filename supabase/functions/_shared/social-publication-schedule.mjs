// Canonical Amsterdam scheduling and provider-dispatch safety for social content.
export function amsterdamScheduledFor(runDate, localHour) {
  const date = String(runDate ?? '').trim();
  const hour = Number(localHour);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error('SOCIAL_SCHEDULE_INVALID_LOCAL_DATE_OR_HOUR');
  }
  const sample = new Date(date + 'T12:00:00Z');
  if (!Number.isFinite(sample.getTime()) || sample.toISOString().slice(0, 10) !== date) {
    throw new Error('SOCIAL_SCHEDULE_INVALID_LOCAL_DATE_OR_HOUR');
  }
  const tzPart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam', timeZoneName: 'longOffset',
  }).formatToParts(sample).find(p => p.type === 'timeZoneName')?.value;
  const match = /^GMT([+-]\d{2}:\d{2})$/.exec(tzPart ?? '');
  if (!match) throw new Error('SOCIAL_SCHEDULE_AMSTERDAM_OFFSET_UNAVAILABLE');
  return date + 'T' + String(hour).padStart(2, '0') + ':00:00' + match[1];
}

export function linkedinDispatchReadiness(channel, scheduledFor, nowMs = Date.now()) {
  if (channel !== 'linkedin_company' && channel !== 'linkedin_personal') {
    return { status: 'not_applicable' };
  }
  const raw = typeof scheduledFor === 'string' ? scheduledFor.trim() : '';
  const dateMs = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(raw)
    ? Date.parse(raw) : Number.NaN;
  if (!Number.isFinite(dateMs) || !Number.isFinite(nowMs)) {
    return { status: 'invalid_schedule' };
  }
  return dateMs > nowMs
    ? { status: 'not_due', due_at: new Date(dateMs).toISOString() }
    : { status: 'due', due_at: new Date(dateMs).toISOString() };
}
