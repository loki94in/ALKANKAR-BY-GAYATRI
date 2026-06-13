# Free Deployment Guide (Vercel)

Follow these steps to deploy your website live on the internet for **100% free** using Vercel.

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

## Step 2: Connect to Vercel
1. Go to [Vercel](https://vercel.com) and sign up for a free **Hobby** account. Choose **Sign Up with GitHub** (this makes deployment very easy).
2. Once logged in to Vercel Dashboard, click the **Add New...** button and select **Project**.

## Step 3: Import and Deploy
1. You will see a list of your GitHub repositories. Find your repository (e.g., `ALKANKAR-BAY-GAYATRI`) and click **Import**.
2. Under "Configure Project", you don't need to change any settings:
   - Framework Preset: `Other` (or Vercel will auto-detect it as a static project)
   - Root Directory: `./`
   - Build & Development Settings: Leave default (none required)
3. Click **Deploy**.

## Step 4: Your Website is Live!
1. Within a few seconds, Vercel will complete the deployment and show a preview screen.
2. Click the preview or the provided URL (e.g., `alankar-by-gayatri.vercel.app`) to open your live website.
3. Every time you make changes to your code locally and push them to GitHub (`git push`), Vercel will **automatically rebuild and update** your live site instantly!

---
*Note: Vercel's Hobby tier is completely free and has plenty of bandwidth for small business websites.*
