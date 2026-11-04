// Recognise operational spreadsheet dependency, not the English verb "excel at".
export function isSpreadsheetBusinessContext(value) {
  const text=String(value??'').toLowerCase();
  // Explicit file type, operational spreadsheet software or Excel dependency.
  return /\b(?:spreadsheets?|spread[ -]?sheets?|werkbladen?|werkmap(?:pen)?|xlsx|xlsm|xlsb)\b/i.test(text)
    || /\bexcel(?:[- /](?:bestanden?|files?|sheets?|tabellen?|formules?|rapport(?:age)?s?|modellen?|lijsten?|planning|administratie|exports?|imports?|data|werkmap|workbook))\b/i.test(text)
    || /\b(?:in|met|via|naar|uit|zonder|from|using|in|with|afhankelijk van)\s+excel\b/i.test(text)
    || /\bexcel\s+(?:bestand|files?|sheet|formula|report|spreadsheet|dashboard)\b/i.test(text);
}
