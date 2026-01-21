# EDCO Heating & Air CRM Dashboard - Setup Guide

A complete CRM dashboard built with React + Vite + Tailwind CSS, using Google Sheets as the database.

## Prerequisites

- Node.js 18+ installed
- A Google account
- Basic familiarity with Google Sheets

---

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "EDCO CRM Database" (or any name you prefer)
4. Keep this tab open - you'll need the spreadsheet ID later

---

## Step 2: Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `google-apps-script/Code.gs` from this project
4. Paste it into the Apps Script editor
5. Click **Save** (Ctrl/Cmd + S)
6. Name the project "EDCO CRM API"

### Initialize the Sheets

1. In the Apps Script editor, select `initializeAllSheets` from the function dropdown
2. Click **Run**
3. Grant the necessary permissions when prompted:
   - Click "Review Permissions"
   - Select your Google account
   - Click "Advanced" then "Go to EDCO CRM API (unsafe)"
   - Click "Allow"
4. Check your Google Sheet - you should now see tabs for:
   - Users (with a default admin user)
   - Customers
   - Projects
   - Equipment
   - WorkDays
   - Payments
   - Photos

---

## Step 3: Deploy the Apps Script as Web App

1. In Apps Script, click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: "EDCO CRM API v1"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. **Copy the Web app URL** - you'll need this!
   - It looks like: `https://script.google.com/macros/s/ABC123.../exec`

---

## Step 4: Configure the React App

1. In the project folder, create a `.env` file:

```bash
cp .env.example .env
```

2. Edit `.env` and paste your Web app URL:

```
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

---

## Step 5: Install Dependencies & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

---

## Step 6: Login

Use the default credentials:

- **Email**: `admin@edcoheating.com`
- **Password**: `admin123`

---

## Sample Data

You can add this sample data directly to your Google Sheet to get started:

### Customers Tab

| id | firstName | lastName | email | phone | address | city | state | zip | createdAt |
|----|-----------|----------|-------|-------|---------|------|-------|-----|-----------|
| (leave blank - auto-generated) | John | Smith | john@email.com | (408) 555-1234 | 123 Oak St | San Jose | CA | 95128 | (auto) |
| (leave blank) | Sarah | Johnson | sarah@email.com | (408) 555-5678 | 456 Maple Ave | Fremont | CA | 94536 | (auto) |
| (leave blank) | Mike | Williams | mike@email.com | (650) 555-9012 | 789 Pine Rd | Palo Alto | CA | 94301 | (auto) |

### Projects Tab

| id | customerId | projectName | contractor | status | natureOfJob | estimateAmount | contractAmount | notes | createdAt |
|----|------------|-------------|------------|--------|-------------|----------------|----------------|-------|-----------|
| (auto) | (John's ID) | HVAC System Replacement | Ed | in-progress | Replace old furnace and AC unit with new high-efficiency system | 12500 | 11800 | Customer prefers Carrier brand | (auto) |
| (auto) | (Sarah's ID) | Kitchen Remodel | Ed | estimate | Complete kitchen renovation including cabinets, counters, and flooring | 45000 | | Waiting for customer approval | (auto) |

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variable:
   - Name: `VITE_GOOGLE_SCRIPT_URL`
   - Value: Your Apps Script Web app URL
5. Deploy!

---

## Deployment (Netlify)

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Import your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variable in Site settings > Environment variables:
   - Key: `VITE_GOOGLE_SCRIPT_URL`
   - Value: Your Apps Script Web app URL
6. Trigger a redeploy

---

## Updating the Apps Script

If you make changes to `Code.gs`:

1. Update the code in Apps Script
2. Go to **Deploy > Manage deployments**
3. Click the pencil icon to edit
4. Change version to "New version"
5. Click **Deploy**

Note: The URL stays the same, so no need to update your `.env`

---

## Troubleshooting

### "Failed to fetch" errors
- Check that your Apps Script is deployed correctly
- Verify the URL in your `.env` file is correct
- Make sure "Who has access" is set to "Anyone"

### Login not working
- Verify the Users tab exists in your Google Sheet
- Check that the default admin user was created
- Password is case-sensitive: `admin123`

### Data not saving
- Check browser console for errors
- Verify Apps Script has proper permissions
- Make sure sheet column headers match exactly

### CORS errors
- Apps Script handles CORS automatically when deployed correctly
- Re-deploy if issues persist

---

## Features

- **Dashboard**: Overview with stats and quick actions
- **Customers**: Full CRUD for customer management
- **Projects**: Track projects with status, estimates, and contracts
- **Equipment**: Log equipment per project with serial numbers
- **Work Days**: Track hours worked on each project
- **Payments**: Record payments with multiple methods
- **Photos**: Upload project photos (stored as base64)
- **Schedule**: View all work days across projects
- **Settings**: Manage account and view connection status

---

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Database**: Google Sheets
- **API**: Google Apps Script

---

## License

MIT License - Free for personal and commercial use.
