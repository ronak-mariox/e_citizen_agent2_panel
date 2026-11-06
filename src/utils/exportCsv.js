/**
 * Turning a list already on screen into a CSV file the browser downloads —
 * the one thing every "Export" button on this panel is supposed to do and,
 * until now, none of them actually did (see the pages that called this).
 */

/** A field's value, quoted only when it has to be — a comma, a quote or a
    newline inside it would otherwise be read as a second column. */
function toCsvField(value) {
  if (value === null || value === undefined) return '';

  const text = String(value);

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Builds the CSV and hands it to the browser as a download — no server
 * round trip, since every field a row's own export needs is already sitting
 * in the app's state by the time an agent clicks Export.
 *
 * @param {string} filename e.g. `"assigned-queue-2026-08-27.csv"`.
 * @param {{ label: string, value: (row: object) => unknown }[]} columns
 *   One column per CSV column, in order. `value` reads whatever it needs off
 *   a row — the same row objects the table itself renders from, so a column
 *   here can read anything the API already returned, not only what the
 *   table shows.
 * @param {object[]} rows
 */
export function downloadCsv(filename, columns, rows) {
  const header = columns.map((column) => toCsvField(column.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((column) => toCsvField(column.value(row))).join(','),
  );

  // A leading BOM so Excel (which guesses encoding from the first bytes, not
  // the Content-Type) reads this as UTF-8 rather than mis-decoding a citizen
  // or officer name with a non-ASCII character in it.
  const csv = '﻿' + [header, ...lines].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Not immediate: the download has to actually start reading the blob
  // first, and revoking the URL out from under it would fail the download
  // depending on the browser's own timing.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "2026-08-27", for a filename an agent can sort by date without opening it. */
export function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}
