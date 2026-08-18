/**
 * So ILL Veggies — Gallery JSON feed
 * Deploy as a Web App (Deploy > New deployment > Web app) so the URL
 * returns this sheet's rows as a JSON array matching gallery.json's shape:
 * [{ "title": "", "category": "", "alt": "", "imageUrl": "" }, ...]
 */
var SHEET_NAME = "website_gallery";
 
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Sheet '" + SHEET_NAME + "' not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
 
  var data = sheet.getDataRange().getValues();
  var headers = data.shift().map(function (h) {
    return String(h).trim();
  });
 
  var items = data
    .filter(function (row) {
      return String(row[0]).trim() !== ""; // skip blank rows (title empty)
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (header, i) {
        obj[header] = row[i] === "" ? undefined : row[i];
      });
      return obj;
    });
 
  return ContentService
    .createTextOutput(JSON.stringify(items))
    .setMimeType(ContentService.MimeType.JSON);
}
