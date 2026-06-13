# Google Sheets Backend Setup

Follow these simple steps to set up your free order database on Google Sheets:

## Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com) and create a **blank spreadsheet**.
2. Give your sheet a name, for example: `Alankar by Gayatri Orders`.

## Step 2: Open Google Apps Script Editor
1. In your spreadsheet, click on **Extensions** in the top menu.
2. Click on **Apps Script**. This will open a code editor window.

## Step 3: Copy and Paste the Script
1. Delete any default code in the editor (usually `function myFunction() {}`).
2. Open the file `backend/google-apps-script.js` from this project.
3. Copy all of its code and paste it into the Google Apps Script editor.
4. Click the **Save** icon (floppy disk) at the top of the editor.

## Step 4: Deploy as a Web App
1. In the top right corner of the Apps Script page, click the **Deploy** button and select **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `Alankar Order Backend`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` (This allows the website to send orders to the sheet. Your email/credentials are kept private by Google).
4. Click **Deploy**.
5. Google will ask you to authorize access. Click **Authorize Access**, log into your Google account, click **Advanced**, and then click **Go to Untitled project (unsafe)** or **Allow** to give permission.
6. Once deployed, copy the **Web app URL** displayed under "URL" (it ends with `/exec`).

## Step 5: Save the Web App URL in your Admin Panel
1. Open your live website (or run it locally).
2. Click on the admin cog icon (⚙) in the footer to open the login modal.
3. Login using your admin credentials (default username: `manhattan`, default password: `manhattan`).
4. Click the **Settings** button in the admin header.
5. In the settings modal, paste the copied URL into the **Google Sheet Apps Script URL** field.
6. Click **Save**.

Your backend is now fully configured! Test it by placing an order from the catalog — you should see it appear as a row in your Google Sheet instantly.
