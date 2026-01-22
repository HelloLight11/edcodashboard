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

// Handle POST requests (Create, Update, Delete, Send Email)
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

    // Send proposal email
    if (action === 'sendProposal') {
      return handleSendProposal(data.proposal);
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

// Handle sending proposal email
function handleSendProposal(proposal) {
  try {
    const { customerEmail, customerName, projectName, estimateAmount, natureOfJob, notes, contractor } = proposal;

    if (!customerEmail) {
      return createResponse({ success: false, error: 'Customer email is required' }, 400);
    }

    const subject = `Proposal for ${projectName} - EDCO Heating & Air`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #4f46e5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0 0; opacity: 0.9; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .greeting { font-size: 18px; margin-bottom: 20px; }
          .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .details-row:last-child { border-bottom: none; }
          .details-label { color: #6b7280; font-weight: 500; }
          .details-value { color: #111827; font-weight: 600; }
          .amount { font-size: 28px; color: #059669; font-weight: bold; text-align: center; padding: 20px; background: #ecfdf5; border-radius: 8px; margin: 20px 0; }
          .notes { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .notes-title { font-weight: 600; color: #92400e; margin-bottom: 5px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
          .footer p { margin: 5px 0; color: #6b7280; font-size: 14px; }
          .cta { display: inline-block; background: linear-gradient(135deg, #3b82f6, #4f46e5); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EDCO Heating & Air</h1>
            <p>Professional HVAC Services</p>
          </div>

          <div class="content">
            <p class="greeting">Dear ${customerName},</p>

            <p>Thank you for considering EDCO Heating & Air for your HVAC needs. We are pleased to provide you with the following proposal:</p>

            <div class="details">
              <div class="details-row">
                <span class="details-label">Project</span>
                <span class="details-value">${projectName}</span>
              </div>
              ${natureOfJob ? `
              <div class="details-row">
                <span class="details-label">Nature of Work</span>
                <span class="details-value">${natureOfJob}</span>
              </div>
              ` : ''}
              ${contractor ? `
              <div class="details-row">
                <span class="details-label">Contractor</span>
                <span class="details-value">${contractor}</span>
              </div>
              ` : ''}
            </div>

            <div class="amount">
              Estimated Total: $${parseFloat(estimateAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            ${notes ? `
            <div class="notes">
              <p class="notes-title">Additional Notes:</p>
              <p>${notes}</p>
            </div>
            ` : ''}

            <p>This proposal is valid for 30 days. If you have any questions or would like to proceed, please don't hesitate to contact us.</p>

            <p>We look forward to working with you!</p>

            <p>Best regards,<br><strong>EDCO Heating & Air Team</strong></p>
          </div>

          <div class="footer">
            <p><strong>EDCO Heating & Air</strong></p>
            <p>Professional HVAC Installation & Service</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    GmailApp.sendEmail(customerEmail, subject, `Proposal for ${projectName} - Estimated Amount: $${estimateAmount}`, {
      htmlBody: htmlBody,
      name: 'EDCO Heating & Air'
    });

    return createResponse({ success: true, message: 'Proposal sent successfully' });

  } catch (error) {
    return createResponse({ success: false, error: error.toString() }, 500);
  }
}

// Test function
function testGetAll() {
  const sheet = getSheet('Customers');
  const data = sheetToJson(sheet);
  Logger.log(data);
}
