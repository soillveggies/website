
function processSheet(sheet) {
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
  return items;
}

function buildJSON(SHEET_ARRAY) {
  var jsonObj = {}
  for (let i = 0; i < SHEET_ARRAY.length; i++) {
    var sheet = SHEET_ARRAY[i];
    var SHEET_NAME = sheet.getName();

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (SHEET_NAME === "README") {
      continue
    }

    var items = processSheet(sheet)
    jsonObj[SHEET_NAME] = items;
  }

  return jsonObj;
}

function doGet(e) {
  var SHEET_ARRAY = SpreadsheetApp.getActiveSpreadsheet().getSheets()

  var jsonObj = buildJSON(SHEET_ARRAY);
  
  return ContentService
    .createTextOutput(JSON.stringify(jsonObj))
    .setMimeType(ContentService.MimeType.JSON);
}
