function doPost(e) {
  try {
    // Parse the JSON request body
    var requestData = JSON.parse(e.postData.contents);
    
    // Open the default active spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // If sheet is empty, write headers first
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Customer Name", "Phone Number", "Delivery Address", "Items ordered", "Total Price (INR)"]);
      // Format headers
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#c9a844").setFontColor("#1e0404");
    }
    
    // Append order details as a new row
    sheet.appendRow([
      requestData.date || new Date().toISOString(),
      requestData.name,
      requestData.phone,
      requestData.address,
      requestData.items,
      requestData.total
    ]);
    
    // Return a success JSON response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Order recorded successfully in Google Sheet"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return an error JSON response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
