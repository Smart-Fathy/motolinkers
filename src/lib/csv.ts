// Minimal RFC-4180-ish CSV parser. Handles:
// - Comma separators, double-quoted strings, escaped quotes (`""`).
// - LF and CRLF line endings.
// - UTF-8 BOM at the start of the file.
// - Embedded commas/newlines inside quoted strings.
//
// Returns a 2D `string[][]` array. Empty trailing rows are dropped so a
// trailing newline doesn't produce a phantom row of empty strings.
export function parseCsv(input: string): string[][] {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else if (ch === "\r") {
      // ignore — handle on the following \n (or end-of-file below)
    } else {
      cell += ch;
    }
  }

  // Flush trailing cell + row.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // Drop trailing rows that are entirely empty.
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c === "")) {
    rows.pop();
  }

  return rows;
}

// Convert a Google Sheets share URL into the sheet's CSV-export URL. Returns
// `null` if the input isn't a recognisable Sheets URL.
//
// Accepts:
//   https://docs.google.com/spreadsheets/d/<id>/edit#gid=<gid>
//   https://docs.google.com/spreadsheets/d/<id>/edit?gid=<gid>
//   https://docs.google.com/spreadsheets/d/<id>/...
export function googleSheetExportUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.hostname !== "docs.google.com") return null;
  if (!url.pathname.startsWith("/spreadsheets/d/")) return null;
  const idMatch = url.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
  if (!idMatch) return null;
  const sheetId = idMatch[1];

  // gid lives either in the hash (`#gid=42`) or the query (`?gid=42`).
  let gid = url.searchParams.get("gid");
  if (!gid && url.hash) {
    const hashGid = url.hash.match(/gid=(\d+)/);
    if (hashGid) gid = hashGid[1];
  }
  if (!gid) gid = "0";

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}
