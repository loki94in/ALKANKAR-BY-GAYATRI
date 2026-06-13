# Free Deployment Guide (Vercel)

Follow these steps to deploy your website live on the internet for **100% free** using Vercel.

---

## Step 1: Upload your project to GitHub

1. Create a free account on [GitHub](https://github.com) if you don't have one.
2. Install [Git](https://git-scm.com/) on your computer.
3. Open a terminal in your project directory and run these commands to publish it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Alankar website"
   ```
4. Create a new repository on GitHub (keep it private if you want).
5. Copy the remote URL from GitHub and run:
   ```bash
   git remote add origin <your-repository-url>
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Connect to Vercel

1. Go to [Vercel](https://vercel.com) and sign up for a free **Hobby** account. Choose **Sign Up with GitHub** (this makes deployment very easy).
2. Once logged in to Vercel Dashboard, click the **Add New...** button and select **Project**.

---

## Step 3: Configure Environment Variables & Deploy

1. You will see a list of your GitHub repositories. Find your repository and click **Import**.
2. Under **Configure Project**, expand the **Environment Variables** section.
3. Add the following environment variables (highly recommended for production):
   * **`GOOGLE_SHEET_URL`**: Your Google Apps Script Web App URL (to sync orders/enquiries).
   * **`IMGBB_API_KEY`**: Your ImgBB API key (crucial for supporting image uploads in production). Get one for free at [api.imgbb.com](https://api.imgbb.com/).
   * **`ADMIN_USER`**: Your custom admin username (defaults to `manhattan` if not set).
   * **`ADMIN_PASS`**: Your custom admin password (defaults to `manhattan` if not set).
4. Click **Deploy**.

---

## Step 4: Your Website is Live!

1. Within a few seconds, Vercel will complete the deployment and show a preview screen.
2. Click the preview or the provided URL (e.g., `alankar-by-gayatri.vercel.app`) to open your live website.

---

## ⚠️ Important: Production Storage & Catalog Management Workflow

Because Vercel is a **serverless execution environment**, its filesystem is read-only. Standard operations that write files locally (like editing products in the Admin panel or uploading image files to local storage) **will not save permanently** in production.

To add new products or update prices, use the following simple, zero-cost workflow:

1. **Run Locally:** Run the site on your computer using:
   ```bash
   npm start
   ```
2. **Make Catalog Edits:** Open `http://localhost:60263` in your browser, log in to the admin panel, and add, edit, or delete products and categories. This instantly updates `data/products.json` and `data/categories.json` on your computer.
3. **Deploy Catalog Updates:** Stage, commit, and push the updated files to GitHub:
   ```bash
   git add data/
   git commit -m "Update product catalog"
   git push origin main
   ```
4. Vercel will automatically detect the push, rebuild, and update your live website instantly with the new catalog!
