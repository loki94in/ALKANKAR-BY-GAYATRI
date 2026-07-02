# Free Deployment Guide (Vercel + JSONBin)

Deploy your website **100% free, forever** — with full live product editing from the admin panel, no technical knowledge required.

---

## Step 1: Get a Free JSONBin Account (5 minutes)

JSONBin stores your products, categories, and orders in the cloud so they persist on Vercel.

1. Go to **[jsonbin.io](https://jsonbin.io)** and click **Sign Up** (it's free).
2. After signing in, click **+ Create Bin** in the left sidebar.
3. In the editor, paste this starting data and click **Create**:
   ```json
   {}
   ```
4. Copy the **Bin ID** shown at the top (looks like `64abc123...`).
5. Click your avatar (top right) → **API Keys** → **+ Create a Key** → copy the key.

---

## Step 2: Upload your project to GitHub

1. Create a free account on [GitHub](https://github.com) if you don't have one.
2. Open a terminal in your project folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Create a new repository on GitHub, then run:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: Deploy on Vercel (Free)

1. Go to **[vercel.com](https://vercel.com)** → Sign up with GitHub.
2. Click **Add New → Project** → import your GitHub repo.
3. Under **Environment Variables**, add ALL of these:

| Variable | Value | Required? |
|---|---|---|
| `JSONBIN_API_KEY` | Your JSONBin Master Key | ✅ YES |
| `JSONBIN_BIN_ID` | Your JSONBin Bin ID | ✅ YES |
| `ADMIN_USER` | Your admin username (e.g. `gayatri`) | Recommended |
| `ADMIN_PASS` | Your admin password (e.g. `gayatri123`) | Recommended |
| `GOOGLE_SHEET_URL` | Your Google Apps Script URL | For order emails |
| `INSTAGRAM_HANDLE` | Your Instagram handle | Optional |
| `WHATSAPP_NUMBER` | Your WhatsApp number (digits only) | Optional |

4. Click **Deploy**. Your site is live in ~30 seconds!

---

## Step 4: That's It!

- Your live URL will be like: `https://alankar-by-gayatri.vercel.app`
- Share that URL with your customers. Anyone can browse and place enquiries.
- Log in to the Admin panel **directly on the live site** to add/edit/delete products and categories. Changes are saved to JSONBin and appear instantly.

---

## ⚠️ Image Uploads in Production

For product images on the live site, use **image URLs** instead of uploading files. Free options:
- Upload to [imgbb.com](https://imgbb.com) (free) → paste the direct link
- Upload to [postimages.org](https://postimages.org) → paste the direct link
- Paste any public image URL from the web

---

## Updating Your Site

Any code changes (CSS, design, etc.) just push to GitHub:
```bash
git add .
git commit -m "Update design"
git push origin main
```
Vercel auto-redeploys in seconds. Product data is always safe in JSONBin.
