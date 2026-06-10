# Admin Guide — mySCM Macro Process Register
## Version 1.0 | For System Administrators

---

## Table of Contents

1. Admin Role Overview
2. Accessing the Admin Panel
3. User Management
4. Viewing All Scenarios
5. Global Insights
6. Changing the Admin Email
7. Firebase Console Administration
8. Firestore Data Structure
9. Backup and Data Management
10. Security Considerations
11. Updating and Redeploying the Application

---

## 1. Admin Role Overview

The admin role gives you access to:

- **User Management** — view all users, add new users, activate or deactivate accounts
- **All Scenarios** — read-only view of every scenario created by every user
- **Global Insights** — aggregate statistics across the entire system

The admin email is set during deployment using the `VITE_ADMIN_EMAIL` environment variable. The first user who signs up with that email address automatically receives the admin role.

**Important:** There can only be one admin at a time in the default configuration. Do not deactivate the admin account.

---

## 2. Accessing the Admin Panel

1. Log in with the admin email address
2. In the left sidebar, click **"Admin"** (this menu item only appears for admin users)
3. The Admin Panel opens with three tabs: User Management, All Scenarios, Global Insights

---

## 3. User Management

### Viewing All Users

The User Management tab displays a table of all registered users with:
- Name and email address
- Role (admin or user)
- Account status (active or inactive)
- Number of scenarios created
- Account creation date

### Adding a New User

You can pre-create accounts for users rather than asking them to self-register.

1. Click **"+ Add User"**
2. Enter:
   - **Full name**
   - **Email address** (required)
   - **Role** — User (default) or Admin
3. Click **"Create"**

The user's initial password is set to `changeme`. Inform the user and ask them to change it immediately after their first login.

> Note: Firebase does not have a built-in "change password on first login" feature. For security, ask users to update their password via the browser's account settings, or implement a password reset email using Firebase's built-in reset functionality.

### Activating and Deactivating Users

To deactivate a user (e.g. if they leave the organisation):

1. Find the user in the table
2. Click **"Deactivate"** in the Actions column
3. Their status changes to "Inactive"

To reactivate:
1. Find the user
2. Click **"Activate"**

> Note: Deactivating a user in Firestore sets their status flag to "inactive" but does **not** prevent them from logging in via Firebase Authentication. For a complete account suspension, you must also disable the user in the **Firebase Authentication console**:
> 1. Go to Firebase Console → Authentication → Users
> 2. Find the user, click the three-dot menu, select "Disable account"

### Admin Protections

- You cannot deactivate your own admin account from within the app
- You cannot change the role of the admin account from within the app
- To transfer admin access, update the `VITE_ADMIN_EMAIL` environment variable in Netlify and redeploy

---

## 4. Viewing All Scenarios

The **All Scenarios** tab shows a read-only table of every scenario in the system, including:

- Scenario name and description
- Company name
- User who created it
- Creation date

This gives you an overview of all work in progress without being able to modify other users' data.

---

## 5. Global Insights

The **Global Insights** tab provides system-wide statistics:

**Summary Cards:**
- Total users registered
- Active users
- Total companies
- Total scenarios

**Companies by Sector Chart:**
A bar chart showing the breakdown of companies by sector. Useful for understanding the profile of your user base.

**Scenarios per User:**
A list showing how many scenarios each user has created. Useful for identifying active vs. inactive users.

---

## 6. Changing the Admin Email

To change which email address has admin privileges:

1. Go to **Netlify** → your site → **"Site settings"**
2. Click **"Environment variables"**
3. Find `VITE_ADMIN_EMAIL` and click **"Edit"**
4. Change the value to the new admin email
5. Click **"Save"**
6. Go to **"Deploys"** → **"Trigger deploy"** → **"Clear cache and deploy site"**
7. The new admin must sign up (or already have an account) using that email

> Note: If the new admin already has an account, their Firestore `users` document will need to be manually updated to `role: "admin"` via the Firebase Firestore console. A redeploy alone will not retroactively change an existing user's role.

---

## 7. Firebase Console Administration

As admin, you have direct access to Firebase for tasks the app does not cover.

### Firebase Authentication Console

Located at: `https://console.firebase.google.com` → your project → Authentication → Users

From here you can:
- See all registered users and their UIDs
- Disable individual accounts
- Delete accounts permanently
- Reset passwords (send reset email)
- See the last sign-in date for each user

### Firestore Console

Located at: Firebase Console → Firestore Database → Data

The data is organised in these **collections**:

| Collection | Contents |
|---|---|
| `users` | One document per user. Fields: email, name, role, status, createdAt |
| `companies` | One document per company. Fields: companyName, sector, industry, userId, createdAt |
| `scenarios` | One document per scenario. Fields: scenarioName, description, companyId, userId, createdAt, createdBy |
| `processes` | One document per process per scenario (49 per scenario). All editable fields. |
| `recycle` | Soft-deleted processes awaiting permanent deletion or restoration |

You can view, edit, or delete any document directly from the Firestore console if needed.

---

## 8. Firestore Data Structure

### users document
```
{
  email: "user@example.com",
  name: "Jane Smith",
  role: "user",           // "user" or "admin"
  status: "active",       // "active" or "inactive"
  createdAt: Timestamp
}
```

### companies document
```
{
  companyName: "Acme Corp",
  sector: "Manufacturing",
  industry: "Automotive",
  userId: "firebase_uid",
  createdAt: Timestamp
}
```

### scenarios document
```
{
  scenarioName: "Baseline 2025",
  description: "...",
  companyId: "company_doc_id",
  userId: "firebase_uid",
  createdAt: Timestamp,
  createdBy: "Jane Smith"
}
```

### processes document
```
{
  macroId: "Deliver_06",
  scenarioId: "scenario_doc_id",
  companyId: "company_doc_id",
  userId: "firebase_uid",
  inScope: true,
  Justification: "Core O2D process",
  Process_Clarity: 98,
  Exception_Logic: 95,
  // ... all 63 editable fields
  createdAt: Timestamp
}
```

---

## 9. Backup and Data Management

### Exporting Data

Firebase Firestore on the Spark (free) plan does **not** include automated backups. To back up your data:

**Option A — User Export (JSON)**
Each user can export their scenario data as JSON from the Process Register page. Encourage users to export regularly.

**Option B — Firebase Export via Console**
1. Go to Firebase Console → Firestore Database
2. Click the three-dot menu → "Export data"
3. You will need a Google Cloud Storage bucket (requires billing account, but is very low cost)

**Option C — Upgrade to Blaze Plan**
The Firebase Blaze (pay-as-you-go) plan offers scheduled exports. The cost for typical usage is under $1/month.

### Deleting Old Data

To permanently remove a scenario and all its processes:
1. Log in as the user who owns the scenario
2. Go to Scenarios, find the scenario, click Delete
3. Go to Recycle Bin, select all processes, click "Permanently Delete"

Or, from the Firebase Firestore console, you can delete documents directly.

---

## 10. Security Considerations

### Firestore Security Rules

The deployed security rules ensure:
- Only authenticated users can read/write any data
- Users can only read/write their own documents (matched by `userId == request.auth.uid`)
- Admin panel reads from `users` collection are open to all authenticated users (needed to show the user list)

> To tighten security further, you can add an admin check to the users collection rule by verifying the user's role document in the rules.

### Environment Variables

- Never commit your `.env` file to GitHub — it contains your Firebase API key
- The `.env.example` file (which has no real values) is safe to commit
- Netlify environment variables are encrypted at rest

### Password Security

- Users should change the default `changeme` password immediately
- Firebase enforces minimum 6-character passwords
- Consider enabling **multi-factor authentication** in Firebase for admin accounts (Firebase Console → Authentication → Sign-in method → Multi-factor authentication)

---

## 11. Updating and Redeploying the Application

When code updates are available:

### Via GitHub Desktop
1. Copy the updated files into your `scm-app` folder, replacing old files
2. Open GitHub Desktop, add a commit message (e.g. "Update to v1.1")
3. Click "Push origin"
4. Netlify will automatically detect the push and redeploy within 2 minutes

### Forcing a Redeploy
If the automatic deploy does not trigger:
1. Go to Netlify → your site → Deploys
2. Click "Trigger deploy" → "Deploy site"

### After Updating Environment Variables
Always trigger a fresh deploy after changing environment variables:
1. Netlify → Deploys → "Trigger deploy" → "Clear cache and deploy site"

---

*End of Admin Guide*
