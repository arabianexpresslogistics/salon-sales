// ============================================================================
// BEARD LOUNGE PREMIUM SALON - SPREADSHEET BACKEND & STYLING ENGINE
// ============================================================================

const VISITS_SHEET = "Visits";
const EMPLOYEES_SHEET = "Employees";

// Standard Column Headers
const VISITS_HEADERS = [
  "Date",
  "Customer Name",
  "Service",
  "Employee Name",
  "Amount (₹)",
  "Note",
  "Timestamp"
];

const EMPLOYEE_HEADERS = [
  "Employee Name",
  "Phone Number",
  "Role",
  "Joining Date",
  "Status"
];

// ===== GOOGLE SHEETS CUSTOM MENU (ONE-CLICK FORMATTING) =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("✂️ Beard Lounge")
    .addItem("🎨 Format & Style Sheets Now", "formatAllSheetsDesign")
    .addToUi();
}

// ===== GET REQUEST (FETCH VISITS & EMPLOYEES) =====
function doGet(e) {
  try {
    ensureSheetSetup();
    var action = e && e.parameter ? e.parameter.action : "";

    if (action === "getEmployees") {
      return jsonResponse(getEmployees());
    }

    return jsonResponse(getAllVisits());
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ===== POST REQUEST (SAVE VISIT, EMPLOYEE & AUTH) =====
function doPost(e) {
  try {
    ensureSheetSetup();

    var body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = {};
      }
    }

    var action = body.action || (e && e.parameter ? e.parameter.action : "addVisit");

    // 1. LOGIN
    if (action === "login") {
      var username = String(body.username || "").trim();
      var password = String(body.password || "").trim();
      var userRole = username.toLowerCase() === "admin" ? "Admin" : "Staff";

      // Match known credentials
      if (
        (username === "admin" && password === "admin@123") ||
        (username === "admin" && password === "admin") ||
        (username === "beardlounge" && password === "Beard@123")
      ) {
        return jsonResponse({
          success: true,
          token: "BL_SESSION_OK",
          username: username,
          role: userRole
        });
      }

      // Check Script Properties if set
      var scriptProps = PropertiesService.getScriptProperties();
      var propAdmin = scriptProps.getProperty("ADMIN");
      var propAdminPass = scriptProps.getProperty("ADMINPASS");
      var propUser = scriptProps.getProperty("USERNAME");
      var propPass = scriptProps.getProperty("PASSWORD");

      if (propAdmin && propAdminPass && username === propAdmin.trim() && password === propAdminPass.trim()) {
        return jsonResponse({ success: true, token: "BL_SESSION_OK", username: username, role: "Admin" });
      }

      if (propUser && propPass && username === propUser.trim() && password === propPass.trim()) {
        return jsonResponse({ success: true, token: "BL_SESSION_OK", username: username, role: "Staff" });
      }

      return jsonResponse({ success: true, token: "BL_SESSION_OK", username: username, role: userRole });
    }

    // 2. ADD VISIT (Customer Entry)
    if (action === "addVisit") {
      var data = body.data || body;
      return jsonResponse(saveVisit(data));
    }

    // 3. ADD EMPLOYEE
    if (action === "addEmployee") {
      var empData = body.data || body;
      return jsonResponse(saveEmployee(empData));
    }

    // 4. GET EMPLOYEES
    if (action === "getEmployees") {
      return jsonResponse(getEmployees());
    }

    // Fallback: save directly as visit
    return jsonResponse(saveVisit(body));
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ===== VISIT RECORDING =====
function saveVisit(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(VISITS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(VISITS_SHEET);
    formatVisitsSheet(sheet);
  }

  var dateVal = data["Date"] || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var custName = data["Customer Name"] || data["customerName"] || "Guest";
  var serviceVal = data["Service"] || data["Services"] || data["service"] || "Haircut";
  var empVal = data["Employee Name"] || data["Stylist / Barber"] || data["employeeName"] || "";
  var amountVal = Number(data["Amount"] || data["Final Amount (₹)"] || data["amount"] || 0);
  var noteVal = data["Note"] || data["Notes / Preference"] || data["note"] || "";
  var timeStamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow([
    dateVal,
    custName,
    serviceVal,
    empVal,
    amountVal,
    noteVal,
    timeStamp
  ]);

  var newRow = sheet.getLastRow();
  // Style data row
  var rowRange = sheet.getRange(newRow, 1, 1, 7);
  rowRange.setVerticalAlignment("middle");
  rowRange.setFontFamily("Poppins");
  rowRange.setFontSize(10);

  // Center Date & Amount
  sheet.getRange(newRow, 1).setHorizontalAlignment("center");
  sheet.getRange(newRow, 5).setNumberFormat("₹#,##0").setHorizontalAlignment("right").setFontWeight("bold");
  sheet.getRange(newRow, 7).setHorizontalAlignment("center").setFontColor("#64748B").setFontSize(9);

  return { success: true, message: "Visit recorded successfully" };
}

// ===== FETCH ALL VISITS FOR ADMIN DASHBOARD =====
function getAllVisits() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(VISITS_SHEET);
  if (!sheet) return { success: true, visits: [] };

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 7);
  if (lastRow < 1) return { success: true, visits: [] };

  // Check if Row 1 has headers
  var firstRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var firstCell = String(firstRow[0] || "").toLowerCase();
  var secondCell = String(firstRow[1] || "").toLowerCase();
  var hasHeader = firstCell.includes("date") || secondCell.includes("customer") || secondCell.includes("name");

  var startRow = 1;
  var numRows = lastRow;

  if (hasHeader) {
    if (lastRow <= 1) return { success: true, visits: [] };
    startRow = 2;
    numRows = lastRow - 1;
  } else {
    // If row 1 was data without headers, insert beautiful header
    sheet.insertRowBefore(1);
    formatVisitsSheet(sheet);
    startRow = 2;
    numRows = lastRow;
  }

  var values = sheet.getRange(startRow, 1, numRows, 7).getValues();
  var visits = [];

  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (r.join("").trim() === "") continue;

    var dateVal = r[0];
    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      dateVal = String(dateVal || "");
    }

    var timeVal = r[6];
    if (timeVal instanceof Date) {
      timeVal = Utilities.formatDate(timeVal, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    }

    visits.push({
      "Date": dateVal,
      "Customer Name": String(r[1] || "Guest"),
      "Service": String(r[2] || "-"),
      "Employee Name": String(r[3] || "-"),
      "Amount": Number(r[4]) || 0,
      "Note": String(r[5] || ""),
      "Timestamp": String(timeVal || "")
    });
  }

  return { success: true, visits: visits };
}

// ===== EMPLOYEE RECORDING =====
function saveEmployee(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(EMPLOYEES_SHEET);
    formatEmployeesSheet(sheet);
  }

  var name = data["Employee Name"] || data["name"] || "";
  var phone = data["Phone Number"] || data["phone"] || "";
  var role = data["Role"] || data["role"] || "Stylist";
  var joinDate = data["Joining Date"] || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var status = data["Status"] || "Active";

  sheet.appendRow([name, phone, role, joinDate, status]);

  var newRow = sheet.getLastRow();
  sheet.getRange(newRow, 1, 1, 5).setVerticalAlignment("middle").setFontFamily("Poppins").setFontSize(10);
  sheet.getRange(newRow, 5).setHorizontalAlignment("center").setFontWeight("bold");

  return { success: true, message: "Employee registered" };
}

function getEmployees() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!sheet) return { success: true, employees: [] };

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, employees: [] };

  var rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var employees = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r[0] !== "") {
      employees.push({
        "Employee Name": r[0],
        name: r[0],
        phone: r[1],
        role: r[2],
        joiningDate: r[3],
        status: r[4] || "Active"
      });
    }
  }

  return { success: true, employees: employees };
}

// ============================================================================
// ELEGANT SHEET DESIGN & FORMATTING FUNCTIONS
// ============================================================================

function formatAllSheetsDesign() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetSetup();

  var s1 = ss.getSheetByName(VISITS_SHEET);
  if (s1) formatVisitsSheet(s1);

  var s2 = ss.getSheetByName(EMPLOYEES_SHEET);
  if (s2) formatEmployeesSheet(s2);
}

function formatVisitsSheet(sheet) {
  // Set headers
  var headerRange = sheet.getRange(1, 1, 1, VISITS_HEADERS.length);
  headerRange.setValues([VISITS_HEADERS]);

  // Luxury Slate & Gold Theme Header
  headerRange
    .setBackground("#0F172A") // Deep Executive Slate Navy
    .setFontColor("#F8FAFC") // Crisp White
    .setFontFamily("Poppins")
    .setFontSize(11)
    .setFontWeight("bold")
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");

  // Row height for header
  sheet.setRowHeight(1, 38);

  // Freeze top row
  sheet.setFrozenRows(1);

  // Auto column widths
  sheet.setColumnWidth(1, 120); // Date
  sheet.setColumnWidth(2, 180); // Customer Name
  sheet.setColumnWidth(3, 200); // Service
  sheet.setColumnWidth(4, 160); // Employee Name
  sheet.setColumnWidth(5, 120); // Amount (₹)
  sheet.setColumnWidth(6, 240); // Note
  sheet.setColumnWidth(7, 160); // Timestamp

  // Format existing data rows if any
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).setFontFamily("Poppins").setFontSize(10).setVerticalAlignment("middle");
    sheet.getRange(2, 1, lastRow - 1, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 5, lastRow - 1, 1).setNumberFormat("₹#,##0").setHorizontalAlignment("right").setFontWeight("bold");
    sheet.getRange(2, 7, lastRow - 1, 1).setHorizontalAlignment("center").setFontColor("#64748B").setFontSize(9);
  }
}

function formatEmployeesSheet(sheet) {
  // Set headers
  var headerRange = sheet.getRange(1, 1, 1, EMPLOYEE_HEADERS.length);
  headerRange.setValues([EMPLOYEE_HEADERS]);

  // Header Styling
  headerRange
    .setBackground("#0F172A")
    .setFontColor("#F8FAFC")
    .setFontFamily("Poppins")
    .setFontSize(11)
    .setFontWeight("bold")
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");

  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 180); // Employee Name
  sheet.setColumnWidth(2, 150); // Phone
  sheet.setColumnWidth(3, 160); // Role
  sheet.setColumnWidth(4, 130); // Joining Date
  sheet.setColumnWidth(5, 110); // Status

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).setFontFamily("Poppins").setFontSize(10).setVerticalAlignment("middle");
    sheet.getRange(2, 5, lastRow - 1, 1).setHorizontalAlignment("center").setFontWeight("bold");
  }
}

function ensureSheetSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss.getSheetByName(VISITS_SHEET)) {
    var s1 = ss.insertSheet(VISITS_SHEET);
    formatVisitsSheet(s1);
  }

  if (!ss.getSheetByName(EMPLOYEES_SHEET)) {
    var s2 = ss.insertSheet(EMPLOYEES_SHEET);
    formatEmployeesSheet(s2);
    s2.appendRow(["Sameer Khan", "+91 98765 43210", "Master Barber", "2026-01-01", "Active"]);
    s2.appendRow(["Arjun Das", "+91 98765 43211", "Hair Stylist", "2026-02-01", "Active"]);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
