const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse optional startDate/endDate (YYYY-MM-DD) from an Express query.
 * End date is inclusive (filters use < end + 1 day).
 */
export function parseAdminDateRange(query = {}) {
  const startDate =
    typeof query.startDate === 'string' && DATE_RE.test(query.startDate)
      ? query.startDate
      : null;
  const endDate =
    typeof query.endDate === 'string' && DATE_RE.test(query.endDate)
      ? query.endDate
      : null;

  if (startDate && endDate && startDate > endDate) {
    return { error: 'startDate must be on or before endDate' };
  }

  return { startDate, endDate };
}

/**
 * Append inclusive date-range SQL predicates using parameterized values.
 * @param {string[]} parts - AND-clauses collector
 * @param {any[]} params - query params collector
 * @param {string} columnSql - SQL expression for the timestamp/date column
 */
export function pushDateRangeFilter(parts, params, columnSql, startDate, endDate) {
  if (startDate) {
    params.push(startDate);
    parts.push(`${columnSql} >= $${params.length}::date`);
  }
  if (endDate) {
    params.push(endDate);
    parts.push(`${columnSql} < ($${params.length}::date + INTERVAL '1 day')`);
  }
}

export function hasDateRange(startDate, endDate) {
  return Boolean(startDate || endDate);
}
