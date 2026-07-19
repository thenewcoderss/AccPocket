export type ReportDetailLimit = { total: number; returned: number; limit: number; limited: boolean };

export function reportLimitMessage(detail: ReportDetailLimit) {
  if (!detail.limited) return null;
  return `Showing ${detail.returned.toLocaleString("en-US")} of ${detail.total.toLocaleString("en-US")} transactions. Summary totals and charts still include the complete selected period. Choose a shorter period to view more detail.`;
}
