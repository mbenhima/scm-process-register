# Setup Guide — mySCM Macro Process Register
## Version 1.0 | For Non-Technical Users

---

## Table of Contents

1. What You Will Need
2. Step 1 — Create a Firebase Project
3. Step 2 — Enable Email/Password Authentication
4. Step 3 — Create a Firestore Database
5. Step 4 — Apply Firestore Security Rules
6. Step 5 — Get Your Firebase Configuration
7. Step 6 — Create a GitHub Repository
8. Step 7 — Upload the Code to GitHub
9. Step 8 — Deploy to Netlify
10. Step 9 — Set Environment Variables in Netlify
11. Step 10 — Final Verification
12. Troubleshooting

---

## 1. What You Will Need

Before you start, make sure you have:

- A computer with a web browser (Chrome or Edge recommended)
- A **Google account** (for Firebase — it's free)
- A **GitHub account** (free at github.com)
- A **Netlify account** (free at netlify.com)
- The application code folder (`scm-app`) provided with this guide

You do **not** need to know how to code. Follow each step exactly as written.

---

## 2. Step 1 — Create a Firebase Project

Firebase is the free database and login service your app will use.

1. Open your browser and go to **https://console.firebase.google.com**
2. Sign in with your Google account
3. Click the **"Add project"** button (blue button in the centre of the screen)
4. Type a name for your project, for example: `myscm-register`
5. Click **Continue**
6. On the "Google Analytics" screen, you can turn it **Off** (toggle the switch) — it is not needed
7. Click **Create project**
8. Wait about 30 seconds for Firebase to set up your project
9. Click **Continue** when the green checkmark appears

You are now inside your Firebase project dashboard.

---

## 3. Step 2 — Enable Email/Password Authentication

This allows users to log in with an email and password.

1. In the left sidebar of Firebase console, click **"Build"** to expand it
2. Click **"Authentication"**
3. Click the **"Get started"** button
4. You will see a list of "Sign-in providers"
5. Click **"Email/Password"** (the first option in the list)
6. Toggle the **first switch** to **On** (it turns blue)
7. Leave the "Email link" option Off
8. Click **Save**

You should now see "Email/Password" listed as an Enabled provider.

---

## 4. Step 3 — Create a Firestore Database

This is the database where all your process data will be stored.

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. A dialog box appears. Select **"Start in test mode"**
   - (We will apply proper security rules in Step 4)
4. Click **Next**
5. Choose a database location closest to your users (e.g. `europe-west1` for Europe, `us-central` for USA)
6. Click **Enable**
7. Wait about 30 seconds for the database to be created

---

## 5. Step 4 — Apply Firestore Security Rules

Security rules protect your data so only the right users can access it.

1. In Firestore, click on the **"Rules"** tab at the top
2. You will see some default rules already there — delete everything in that box
3. Open the file `firestore.rules` from the code folder provided
4. Copy **all** the text in that file
5. Paste it into the Firebase Rules box (replacing everything that was there)
6. Click **"Publish"**
7. A confirmation message will appear — click **"Publish"** again if asked

---

## 6. Step 5 — Get Your Firebase Configuration

This is the "address" information the app uses to connect to your database.

1. In the Firebase console, click the **gear icon** (⚙️) at the top of the left sidebar
2. Click **"Project settings"**
3. Scroll down to the section called **"Your apps"**
4. If you see no apps listed, click the **Web icon** (`</>`) to add a web app
   - Type any name (e.g. `scm-web`) and click **Register app**
5. You will see a block of code that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

6. **Copy each value** — you will need them in Step 9. Keep this page open.

---

## 7. Step 6 — Create a GitHub Repository

GitHub stores your code and connects to Netlify for automatic deployment.

1. Go to **https://github.com** and sign in
2. Click the **"+" icon** in the top right, then click **"New repository"**
3. Name it `scm-process-register` (or any name you prefer)
4. Select **"Public"** (required for free Netlify deployment)
5. Do **not** tick "Add a README file"
6. Click **"Create repository"**
7. GitHub will show you a page with instructions — keep this page open

---

## 8. Step 7 — Upload the Code to GitHub

You will use GitHub's web interface to upload the code files.

**Option A — Using GitHub Desktop (easiest, recommended)**

1. Download GitHub Desktop from **https://desktop.github.com** and install it
2. Open GitHub Desktop and sign in to your GitHub account
3. Click **"File" → "Add local repository"**
4. Navigate to the `scm-app` folder and select it
5. Click **"Add repository"** (if it asks to initialize, click "Initialize")
6. Click **"Publish repository"** at the top
7. Make sure "Keep this code private" is **unticked**
8. Click **"Publish Repository"**

**Option B — Using the GitHub website (drag and drop)**

1. Open your new repository page on GitHub
2. Click **"uploading an existing file"** link
3. Drag and drop the entire contents of the `scm-app` folder into the browser window
4. Wait for all files to upload (this may take a minute)
5. Scroll down and click **"Commit changes"**

---

## 9. Step 8 — Deploy to Netlify

Netlify will host your app for free and connect it to your GitHub repository.

1. Go to **https://netlify.com** and sign in (you can sign in with GitHub)
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. If asked, authorise Netlify to access your GitHub account
5. Find and click on your `scm-process-register` repository
6. Netlify will detect the settings. Verify:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **"Deploy site"** (do NOT deploy yet — first do Step 9)
   - Actually, scroll down first to add environment variables before the first deploy

---

## 10. Step 9 — Set Environment Variables in Netlify

Environment variables keep your Firebase config secure.

1. On the Netlify deploy page (before clicking Deploy), look for **"Environment variables"** section
2. Click **"Add variable"** for each of the following variables:

| Variable Name | Where to find the value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` from Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` from Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` from Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` from Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` from Firebase config |
| `VITE_FIREBASE_APP_ID` | `appId` from Firebase config |
| `VITE_ADMIN_EMAIL` | The email address you want as admin (e.g. `admin@yourcompany.com`) |

3. Type the variable name exactly as shown (including `VITE_` prefix)
4. Paste the corresponding value from Firebase (without the quote marks)
5. Repeat for all 7 variables
6. Click **"Deploy site"**

Netlify will build and deploy your app (takes 1–2 minutes).

---

## 11. Step 10 — Final Verification

1. Netlify will give you a URL like `https://random-name-123.netlify.app`
2. Open this URL in your browser
3. You should see the mySCM login page
4. Click **"Create account"** and sign up using the **admin email** you set in `VITE_ADMIN_EMAIL`
5. You will be logged in and see the dashboard
6. Navigate to **"Companies"** and add your first company
7. Navigate to **"Scenarios"** and create your first scenario
8. The app will automatically create 49 macro processes

**Congratulations — your app is live!**

---

## 12. Troubleshooting

**The page shows a white screen or error after login**
- Check that all 7 environment variables are set correctly in Netlify
- Go to Netlify → Site settings → Environment variables and verify each one
- After changing variables, go to Deploys → "Trigger deploy" → "Clear cache and deploy site"

**"Firebase: Error (auth/invalid-api-key)"**
- Your `VITE_FIREBASE_API_KEY` is wrong or missing
- Copy it again from Firebase Project Settings

**Users cannot sign in after you set up**
- Make sure Email/Password authentication is enabled in Firebase (Step 2)

**"Missing or insufficient permissions" error in the app**
- Your Firestore security rules were not saved correctly
- Repeat Step 4 and make sure you clicked "Publish"

**I need to change the admin email later**
- Go to Netlify → Site settings → Environment variables
- Change `VITE_ADMIN_EMAIL` to the new email
- Trigger a new deploy

**How to add team members**
- Ask them to go to your Netlify URL and click "Create account"
- They sign up with their email
- As admin, you can manage their access in the Admin panel

---

*End of Setup Guide*
