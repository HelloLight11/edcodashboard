/**
 * EDCO Heating & Air CRM - Google Apps Script Backend
 *
 * This script provides a REST API for the CRM dashboard.
 * Deploy as a web app with access set to "Anyone".
 */

// Get the active spreadsheet
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Helper: Get sheet by name
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }

  return sheet;
}

// Initialize sheet with headers
function initializeSheet(sheet, sheetName) {
  const headers = {
    'Users': ['id', 'name', 'email', 'password', 'createdAt'],
    'Customers': ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'createdAt'],
    'Projects': ['id', 'customerId', 'projectName', 'contractor', 'status', 'natureOfJob', 'estimateAmount', 'contractAmount', 'notes', 'createdAt'],
    'Equipment': ['id', 'projectId', 'name', 'type', 'serialNumber'],
    'WorkDays': ['id', 'projectId', 'date', 'hours', 'notes'],
    'Payments': ['id', 'projectId', 'date', 'amount', 'method', 'note'],
    'Photos': ['id', 'projectId', 'url', 'filename', 'createdAt']
  };

  if (headers[sheetName]) {
    sheet.getRange(1, 1, 1, headers[sheetName].length).setValues([headers[sheetName]]);
    sheet.getRange(1, 1, 1, headers[sheetName].length).setFontWeight('bold');
  }
}

// Generate unique ID
function generateId() {
  return Utilities.getUuid();
}

// Get current timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Convert sheet data to JSON array
function sheetToJson(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// Find row index by ID
function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      return i + 1; // Sheet rows are 1-indexed
    }
  }
  return -1;
}

// CORS headers for browser requests
function createResponse(data, status = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// Handle GET requests
function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheet = e.parameter.sheet;
    const id = e.parameter.id;

    // Login check
    if (action === 'login') {
      const email = e.parameter.email;
      const password = e.parameter.password;
      return handleLogin(email, password);
    }

    // Get all data from a sheet
    if (action === 'getAll' && sheet) {
      const sheetObj = getSheet(sheet);
      const data = sheetToJson(sheetObj);
      return createResponse({ success: true, data: data });
    }

    // Get single record by ID
    if (action === 'getById' && sheet && id) {
      const sheetObj = getSheet(sheet);
      const data = sheetToJson(sheetObj);
      const record = data.find(item => item.id === id);
      if (record) {
        return createResponse({ success: true, data: record });
      }
      return createResponse({ success: false, error: 'Record not found' }, 404);
    }

    // Get records by project ID (for Equipment, WorkDays, Payments, Photos)
    if (action === 'getByProject' && sheet && e.parameter.projectId) {
      const sheetObj = getSheet(sheet);
      const data = sheetToJson(sheetObj);
      const filtered = data.filter(item => item.projectId === e.parameter.projectId);
      return createResponse({ success: true, data: filtered });
    }

    return createResponse({ success: false, error: 'Invalid action' }, 400);

  } catch (error) {
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

// Handle POST requests (Create, Update, Delete)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheetName = data.sheet;

    // Create new record
    if (action === 'create' && sheetName) {
      return handleCreate(sheetName, data.record);
    }

    // Update existing record
    if (action === 'update' && sheetName) {
      return handleUpdate(sheetName, data.id, data.record);
    }

    // Delete record
    if (action === 'delete' && sheetName) {
      return handleDelete(sheetName, data.id);
    }

    return createResponse({ success: false, error: 'Invalid action' }, 400);

  } catch (error) {
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

// Handle login
function handleLogin(email, password) {
  try {
    const sheet = getSheet('Users');
    const users = sheetToJson(sheet);
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Don't send password back
      const { password: _, ...safeUser } = user;
      return createResponse({ success: true, data: safeUser });
    }

    return createResponse({ success: false, error: 'Invalid email or password' }, 401);
  } catch (error) {
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

// Handle create
function handleCreate(sheetName, record) {
  try {
    const sheet = getSheet(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Add ID and timestamp
    record.id = generateId();
    if (headers.includes('createdAt')) {
      record.createdAt = getTimestamp();
    }

    // Build row in correct order
    const row = headers.map(header => record[header] || '');

    // Append row
    sheet.appendRow(row);

    return createResponse({ success: true, data: record });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

// Handle update
function handleUpdate(sheetName, id, record) {
  try {
    const sheet = getSheet(sheetName);
    const rowIndex = findRowById(sheet, id);

    if (rowIndex === -1) {
      return createResponse({ success: false, error: 'Record not found' }, 404);
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Keep original ID and createdAt
    record.id = id;

    // Build row in correct order
    const row = headers.map(header => {
      if (record.hasOwnProperty(header)) {
        return record[header];
      }
      // Keep existing value for fields not in the update
      return sheet.getRange(rowIndex, headers.indexOf(header) + 1).getValue();
    });

    // Update row
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);

    return createResponse({ success: true, data: record });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

// Handle delete
function handleDelete(sheetName, id) {
  try {
    const sheet = getSheet(sheetName);
    const rowIndex = findRowById(sheet, id);

    if (rowIndex === -1) {
      return createResponse({ success: false, error: 'Record not found' }, 404);
    }

    sheet.deleteRow(rowIndex);

    return createResponse({ success: true, message: 'Record deleted' });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

// Initialize all sheets (run this once to set up the spreadsheet)
function initializeAllSheets() {
  const sheets = ['Users', 'Customers', 'Projects', 'Equipment', 'WorkDays', 'Payments', 'Photos'];
  sheets.forEach(sheetName => {
    getSheet(sheetName);
  });

  // Add default admin user
  const usersSheet = getSheet('Users');
  const users = sheetToJson(usersSheet);

  if (users.length === 0) {
    usersSheet.appendRow([
      generateId(),
      'Admin',
      'admin@edcoheating.com',
      'admin123',
      getTimestamp()
    ]);
  }

  Logger.log('All sheets initialized successfully!');
}

// Test function
function testGetAll() {
  const sheet = getSheet('Customers');
  const data = sheetToJson(sheet);
  Logger.log(data);
}
