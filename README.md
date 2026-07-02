# Alankar by Gayatri

A fully responsive, elegant Jewellery Catalog website designed for easy administration and seamless customer enquiry generation.

## Features

- **Customer View**: Browse products by categories, view detailed descriptions, and add items to a cart.
- **Enquiry System**: Customers can submit an enquiry for the items in their cart, which sends the order details to a configured Google Sheet.
- **Admin Panel**: Add, edit, delete products and categories, view orders, and update site settings.
- **Settings Management**: Easily update the admin login credentials, WhatsApp number, and Instagram handle from the Admin Settings.
- **Light/Dark Mode**: Built-in toggle for both customer and admin views.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:60263`.

## Deployment

This project is configured to run on Vercel. 
- Use the `server.js` file for running locally.
- In a production environment, Serverless Functions inside the `api/` directory handle requests.
- Ensure your environment variables are configured in Vercel if needed.

## Backend Configuration (Google Sheets)
Please refer to `backend/SETUP.md` for instructions on how to set up the Google Apps Script to receive orders into your own Google Sheet.
