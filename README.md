# Job Search HQ — Career Command Center

A modern, elegant job application tracker and career command center spreadsheet application with real-time analytics, pipeline tracking, follow-up management, and Google Sheets integration.

---

## 🚀 Run Locally

**Prerequisites:** [Node.js](https://nodejs.org/) (v18 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Netlify

### Option 1: Git Integration (Automatic CI/CD)
1. Push this repository to GitHub / GitLab / Bitbucket.
2. Log in to [Netlify](https://app.netlify.com/).
3. Click **"Add new site" > "Import an existing project"**.
4. Select your repository.
5. Netlify will automatically detect settings from [`netlify.toml`](./netlify.toml):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click **Deploy Site**.

### Option 2: Drag & Drop (Netlify Drop)
1. Build the production bundle locally:
   ```bash
   npm install
   npm run build
   ```
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag the generated `dist` folder into the upload area.

---

## 🔐 Google Drive / Sheets Sync Setup

If using Google Sign-In and Google Sheets sync:
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (`gen-lang-client-0560772262`).
3. Under **Authentication > Settings > Authorized Domains**, add your Netlify domain (e.g. `your-site.netlify.app`).
