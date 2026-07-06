export function localDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatTransactionDate(value: string, locale?: string) {
  const calendarDate = new Date(`${value.slice(0, 10)}T00:00:00`);
  return calendarDate.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}
