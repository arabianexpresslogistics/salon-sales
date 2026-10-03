// ============================================================================
// BEARD LOUNGE PREMIUM MEN'S SALON (KUWAIT)
// MULTI-STAFF AUTHENTICATION, ISOLATED SALES & DATA PERSISTENCE ENGINE
// ============================================================================

const VISITS_SHEET = "Visits";
const EMPLOYEES_SHEET = "Employees";

// Standard Column Headers
const VISITS_HEADERS = [
  "Date",
  "Customer Name",
  "Service",
  "Employee Name",
  "Amount (KD)",
  "Payment Method",
  "Note",
  "Created By",
  "Timestamp"
];

const EMPLOYEE_HEADERS = [
  "Employee Name",
  "Username",
  "Password",
  "Role",
  "Phone Number",
  "Joining Date",
  "Status"
];

// ===== GOOGLE SHEETS CUSTOM MENU (ONE-CLICK FORMATTING) =====
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("✂️ Beard Lounge")
    .addItem("🎨 Format & Style Sheets Now", "formatAllSheetsDesign")
    .addItem("👥 Setup Default Staff Accounts", "ensureSheetSetup")
    .addToUi();
}

// ===== GET REQUEST (FETCH VISITS & EMPLOYEES WITH ISOLATION) =====
function doGet(e) {
  try {
    ensureSheetSetup();
    var action = e && e.parameter ? e.parameter.action : "";
    var username = e && e.parameter ? String(e.parameter.username || "").trim().toLowerCase() : "";
    var role = e && e.parameter ? String(e.parameter.role || "").trim() : "";
    var employeeName = e && e.parameter ? String(e.parameter.employeeName || "").trim() : "";

    if (action === "getEmployees") {
      return jsonResponse(getEmployees(username, role));
    }

    return jsonResponse(getAllVisits(username, role, employeeName));
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ===== POST REQUEST (AUTH, SAVE VISIT, SAVE EMPLOYEE) =====
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

    // 1. DYNAMIC LOGIN WITH MULTI-STAFF CREDENTIALS FROM SHEET
    if (action === "login") {
      var username = String(body.username || "").trim();
      var password = String(body.password || "").trim();
      return jsonResponse(authenticateUser(username, password));
    }

    // 2. ADD VISIT (AUTOMATICALLY TAGGED WITH LOGGED-IN STAFF)
    if (action === "addVisit") {
      var data = body.data || body;
      return jsonResponse(saveVisit(data));
    }

    // 3. ADD EMPLOYEE ACCOUNT (ADMIN ONLY)
    if (action === "addEmployee") {
      var empData = body.data || body;
      return jsonResponse(saveEmployee(empData));
    }

    // 4. GET EMPLOYEES
    if (action === "getEmployees") {
      var reqUser = String(body.username || "").trim().toLowerCase();
      var reqRole = String(body.role || "").trim();
      return jsonResponse(getEmployees(reqUser, reqRole));
    }

    // 5. GET VISITS WITH STAFF ISOLATION
    if (action === "getVisits") {
      var u = String(body.username || "").trim().toLowerCase();
      var r = String(body.role || "").trim();
      var empN = String(body.employeeName || "").trim();
      return jsonResponse(getAllVisits(u, r, empN));
    }

    // 6. DELETE EMPLOYEE ACCOUNT (ADMIN ONLY)
    if (action === "deleteEmployee") {
      var delUser = String(body.username || (body.data && body.data.username) || "").trim().toLowerCase();
      var delName = String(body.name || (body.data && body.data.name) || "").trim();
      return jsonResponse(deleteEmployee(delUser, delName));
    }

    return jsonResponse(saveVisit(body));
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ===== AUTHENTICATE USER AGAINST EMPLOYEES SHEET =====
function authenticateUser(username, password) {
  if (!username || !password) {
    return { success: false, error: "Please provide both username and password." };
  }

  var cleanUser = username.trim().toLowerCase();
  var cleanPass = password.trim();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!sheet) {
    ensureSheetSetup();
    sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  }

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var empName = String(row[0] || "").trim();
      var uName = String(row[1] || "").trim().toLowerCase();
      var uPass = String(row[2] || "").trim();
      var uRole = String(row[3] || "Staff").trim();
      var uPhone = String(row[4] || "").trim();
      var uStatus = String(row[6] || "Active").trim();

      if (uName === cleanUser && uPass === cleanPass) {
        if (uStatus.toLowerCase() === "inactive") {
          return { success: false, error: "This staff account is currently inactive. Contact Admin." };
        }
        var token = "BL_TOKEN_" + Utilities.getUuid();
        return {
          success: true,
          token: token,
          username: row[1],
          name: empName,
          role: uRole === "Admin" ? "Admin" : "Staff",
          phone: uPhone
        };
      }
    }
  }

  // Master Fallback Credentials
  if (cleanUser === "admin" && (cleanPass === "admin@123" || cleanPass === "admin")) {
    return {
      success: true,
      token: "BL_ADMIN_OK",
      username: "admin",
      name: "Beard Lounge Admin",
      role: "Admin",
      phone: "+965 9876 5432"
    };
  }

  if (cleanUser === "beardlounge" && cleanPass === "Beard@123") {
    return {
      success: true,
      token: "BL_STAFF_OK",
      username: "beardlounge",
      name: "Sameer Khan",
      role: "Staff",
      phone: "+965 9876 5433"
    };
  }

  return { success: false, error: "Invalid username or password. Please check your credentials." };
}

// ===== SAVE CLIENT VISIT (TAGGED TO LOGGED-IN STAFF) =====
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
  var empVal = data["Employee Name"] || data["Stylist / Barber"] || data["employeeName"] || data["name"] || "Staff";
  var amountVal = Number(data["Amount"] || data["Final Amount (KD)"] || data["Final Amount (₹)"] || data["amount"] || 0);
  var payMethodVal = data["Payment Method"] || data["paymentMethod"] || "KNet";
  var noteVal = data["Note"] || data["Notes / Preference"] || data["note"] || "";
  var createdBy = data["Created By"] || data["username"] || data["currentUser"] || empVal;
  var timeStamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow([
    dateVal,
    custName,
    serviceVal,
    empVal,
    amountVal,
    payMethodVal,
    noteVal,
    createdBy,
    timeStamp
  ]);

  var newRow = sheet.getLastRow();
  // Style data row
  var rowRange = sheet.getRange(newRow, 1, 1, 9);
  rowRange.setVerticalAlignment("middle");
  rowRange.setFontFamily("Poppins");
  rowRange.setFontSize(10);

  // Center & Format
  sheet.getRange(newRow, 1).setHorizontalAlignment("center");
  sheet.getRange(newRow, 5).setNumberFormat("#,##0.00 \"KD\"").setHorizontalAlignment("right").setFontWeight("bold");
  sheet.getRange(newRow, 6).setHorizontalAlignment("center");
  sheet.getRange(newRow, 9).setHorizontalAlignment("center").setFontColor("#64748B").setFontSize(9);

  return { success: true, message: "Visit recorded successfully in KD" };
}

// ===== FETCH VISITS WITH AUTOMATIC USER/STAFF ISOLATION =====
function getAllVisits(username, role, employeeName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(VISITS_SHEET);
  if (!sheet) return { success: true, visits: [] };

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 9);
  if (lastRow < 1) return { success: true, visits: [] };

  // Check headers
  var firstRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var firstCell = String(firstRow[0] || "").toLowerCase();
  var hasHeader = firstCell.includes("date") || String(firstRow[1] || "").toLowerCase().includes("customer");

  var startRow = hasHeader ? 2 : 1;
  var numRows = hasHeader ? lastRow - 1 : lastRow;
  if (numRows < 1) return { success: true, visits: [] };

  var values = sheet.getRange(startRow, 1, numRows, 9).getValues();
  var visits = [];

  var cleanUser = String(username || "").trim().toLowerCase();
  var cleanRole = String(role || "").trim().toLowerCase();
  var cleanEmpName = String(employeeName || "").trim().toLowerCase();
  var isStaffOnly = cleanRole === "staff";

  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (r.join("").trim() === "") continue;

    var dateVal = r[0];
    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      dateVal = String(dateVal || "");
    }

    var staffName = String(r[3] || "");
    var createdByVal = String(r[7] || "");
    var timeVal = r[8];
    if (timeVal instanceof Date) {
      timeVal = Utilities.formatDate(timeVal, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    }

    // ISOLATION FILTER FOR LOGGED-IN STAFF
    if (isStaffOnly && cleanUser !== "admin") {
      var matchName = cleanEmpName && staffName.toLowerCase().includes(cleanEmpName);
      var matchUser = cleanUser && createdByVal.toLowerCase().includes(cleanUser);
      if (!matchName && !matchUser) {
        continue; // Skip other staff's records
      }
    }

    visits.push({
      "Date": dateVal,
      "Customer Name": String(r[1] || "Guest"),
      "Service": String(r[2] || "-"),
      "Employee Name": staffName,
      "Amount": Number(r[4]) || 0,
      "Final Amount (KD)": Number(r[4]) || 0,
      "Payment Method": String(r[5] || "Cash"),
      "Note": String(r[6] || ""),
      "Created By": createdByVal,
      "Timestamp": String(timeVal || "")
    });
  }

  return { success: true, visits: visits };
}

// ===== SAVE EMPLOYEE ACCOUNT (ADMIN ONLY) =====
function saveEmployee(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(EMPLOYEES_SHEET);
    formatEmployeesSheet(sheet);
  }

  var name = String(data["Employee Name"] || data["name"] || "").trim();
  var username = String(data["Username"] || data["username"] || name.toLowerCase().replace(/\s+/g, "")).trim();
  var password = String(data["Password"] || data["password"] || username + "@123").trim();
  var role = String(data["Role"] || data["role"] || "Master Barber").trim();
  var phone = String(data["Phone Number"] || data["phone"] || "9876 5432").trim();
  var joinDate = data["Joining Date"] || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var status = data["Status"] || "Active";

  sheet.appendRow([name, username, password, role, "'" + phone, joinDate, status]);

  var newRow = sheet.getLastRow();
  sheet.getRange(newRow, 1, 1, 7).setVerticalAlignment("middle").setFontFamily("Poppins").setFontSize(10);
  sheet.getRange(newRow, 5).setNumberFormat("@").setHorizontalAlignment("center");
  sheet.getRange(newRow, 7).setHorizontalAlignment("center").setFontWeight("bold");

  return { success: true, message: "Staff account created with username: " + username };
}

// ===== DELETE EMPLOYEE ACCOUNT (ADMIN ONLY) =====
function deleteEmployee(username, employeeName) {
  var cleanUser = String(username || "").trim().toLowerCase();
  var cleanName = String(employeeName || "").trim().toLowerCase();

  if (!cleanUser && !cleanName) {
    return { success: false, error: "Please specify username or staff name to delete." };
  }

  if (cleanUser === "admin") {
    return { success: false, error: "Cannot delete the primary Admin account." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!sheet) return { success: false, error: "Employees sheet not found." };

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false, error: "No staff records found." };

  var rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  for (var i = 0; i < rows.length; i++) {
    var rowEmpName = String(rows[i][0] || "").trim().toLowerCase();
    var rowUserName = String(rows[i][1] || "").trim().toLowerCase();

    if ((cleanUser && rowUserName === cleanUser) || (cleanName && rowEmpName === cleanName)) {
      var rowToDelete = i + 2; // 1-based index (+1 for header)
      sheet.deleteRow(rowToDelete);
      return { success: true, message: "Staff account deleted successfully." };
    }
  }

  return { success: false, error: "Staff account not found in database." };
}

// ===== GET EMPLOYEES (STAFF SEES ONLY THEMSELVES, ADMIN SEES ALL) =====
function getEmployees(username, role) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EMPLOYEES_SHEET);
  if (!sheet) return { success: true, employees: [] };

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: true, employees: [] };

  var rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  var employees = [];
  var cleanUser = String(username || "").trim().toLowerCase();
  var isStaffOnly = String(role || "").trim().toLowerCase() === "staff";

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var empName = String(r[0] || "");
    var uName = String(r[1] || "").toLowerCase();
    if (empName === "") continue;

    // If staff only, filter to current user
    if (isStaffOnly && cleanUser !== "admin") {
      if (uName !== cleanUser && !empName.toLowerCase().includes(cleanUser)) {
        continue;
      }
    }

    var cleanPhone = String(r[4] || "+965").replace(/^'/, "");
    if (cleanPhone === "#ERROR!" || !cleanPhone) {
      cleanPhone = "+965 9876 5432";
    }

    employees.push({
      "Employee Name": empName,
      name: empName,
      username: r[1],
      role: r[3] || "Master Barber",
      phone: cleanPhone,
      joiningDate: r[5],
      status: r[6] || "Active"
    });
  }

  return { success: true, employees: employees };
}

// ===== SHEET FORMATTING & LUXURY DESIGN =====
function formatAllSheetsDesign() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetSetup();

  var s1 = ss.getSheetByName(VISITS_SHEET);
  if (s1) formatVisitsSheet(s1);

  var s2 = ss.getSheetByName(EMPLOYEES_SHEET);
  if (s2) formatEmployeesSheet(s2);
}

function formatVisitsSheet(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, VISITS_HEADERS.length);
  headerRange.setValues([VISITS_HEADERS]);

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

  sheet.setColumnWidth(1, 120); // Date
  sheet.setColumnWidth(2, 180); // Customer Name
  sheet.setColumnWidth(3, 220); // Service
  sheet.setColumnWidth(4, 160); // Employee Name
  sheet.setColumnWidth(5, 130); // Amount (KD)
  sheet.setColumnWidth(6, 130); // Payment Method
  sheet.setColumnWidth(7, 200); // Note
  sheet.setColumnWidth(8, 140); // Created By
  sheet.setColumnWidth(9, 160); // Timestamp

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 9).setFontFamily("Poppins").setFontSize(10).setVerticalAlignment("middle");
    sheet.getRange(2, 1, lastRow - 1, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 5, lastRow - 1, 1).setNumberFormat("#,##0.00 \"KD\"").setHorizontalAlignment("right").setFontWeight("bold");
    sheet.getRange(2, 6, lastRow - 1, 1).setHorizontalAlignment("center");
    sheet.getRange(2, 9, lastRow - 1, 1).setHorizontalAlignment("center").setFontColor("#64748B").setFontSize(9);
  }
}

function formatEmployeesSheet(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, EMPLOYEE_HEADERS.length);
  headerRange.setValues([EMPLOYEE_HEADERS]);

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
  sheet.setColumnWidth(2, 130); // Username
  sheet.setColumnWidth(3, 130); // Password
  sheet.setColumnWidth(4, 160); // Role
  sheet.setColumnWidth(5, 150); // Phone Number
  sheet.setColumnWidth(6, 130); // Joining Date
  sheet.setColumnWidth(7, 110); // Status

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).setFontFamily("Poppins").setFontSize(10).setVerticalAlignment("middle");
    sheet.getRange(2, 5, lastRow - 1, 1).setNumberFormat("@").setHorizontalAlignment("center");
    sheet.getRange(2, 7, lastRow - 1, 1).setHorizontalAlignment("center").setFontWeight("bold");
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
    // Add default initial accounts with apostrophe to prevent formula parsing
    s2.appendRow(["Admin Owner", "admin", "admin@123", "Admin", "'+965 9876 5432", "2026-01-01", "Active"]);
    s2.appendRow(["Sameer Khan", "sameer", "sameer@123", "Master Barber", "'+965 9876 5433", "2026-01-01", "Active"]);
    s2.appendRow(["Arjun Das", "arjun", "arjun@123", "Senior Hair Stylist", "'+965 9876 5434", "2026-01-01", "Active"]);
    s2.appendRow(["Rohan Sharma", "rohan", "rohan@123", "Beard Specialist", "'+965 9876 5435", "2026-01-01", "Active"]);
    s2.appendRow(["Fahad Ali", "fahad", "fahad@123", "Skin & Spa Therapist", "'+965 9876 5436", "2026-01-01", "Active"]);
    s2.appendRow(["Beard Lounge Staff", "beardlounge", "Beard@123", "Staff", "'+965 9876 5437", "2026-01-01", "Active"]);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

