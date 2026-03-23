# Legal Case Management System

A full-stack legal case management web application built with ReactJS and Firebase.

## Features

- **Client Management**: Create, update, and delete clients.
- **Matter (Case) Tracking**: Manage legal cases linked to clients, track next hearing dates, court, and status.
- **Microsoft Calendar Sync**: Manually push hearing dates to Microsoft Calendar via Firebase Cloud Functions.
- **Audit Logs**: Track every action (Creation, Date Updates, Calendar Sync).
- **Weekly Export**: Export cases scheduled between Saturday and the following Friday to Excel.
- **Dashboard Summary**: Quick overview of today's hearings, active matters, and total clients.

## Tech Stack

- **Frontend**: ReactJS, Material UI, Vite, React Router, Date-fns, XLSX.
- **Backend**: Firebase Firestore, Firebase Cloud Functions.
- **Integration**: Microsoft Graph API (via Cloud Functions).

## Setup Instructions

### 1. Firebase Setup
1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Cloud Functions**.
3. Go to Project Settings and add a Web App. Copy the `firebaseConfig` object.
4. Replace the placeholders in `src/firebase/config.js` with your config.

### 2. Microsoft Graph API Setup
1. Register an application in [Azure Portal](https://portal.azure.com/) (App Registrations).
2. Add permissions: `Calendars.ReadWrite`, `User.Read`.
3. Create a Client Secret.
4. Replace the following in `functions/index.js`:
   - `YOUR_MS_CLIENT_ID`
   - `YOUR_TENANT_ID`
   - `YOUR_MS_CLIENT_SECRET`
   - The user email in `/users/legal@nalaw.in/calendar/events`.

### 3. Local Installation
1. Install root dependencies:
   ```bash
   npm install
   ```
2. Install functions dependencies:
   ```bash
   cd functions
   npm install
   ```

### 4. Deployment
1. Install Firebase CLI: `npm install -g firebase-tools`.
2. Login: `firebase login`.
3. Initialize: `firebase init` (select Firestore, Functions, Hosting).
4. Deploy: `firebase deploy`.

## Project Structure

```
nalaw_matter/
├── functions/              # Firebase Cloud Functions (MS Graph Integration)
├── public/                 # Static assets
├── src/
│   ├── components/         # Shared React components (e.g., CaseLogDialog)
│   ├── firebase/           # Firebase configuration
│   ├── pages/              # Page components (Dashboard, Forms, Lists)
│   ├── utils/              # Helper functions
│   ├── App.jsx             # Main application component & routing
│   └── main.jsx            # Entry point
├── firestore.rules         # Firestore security rules
└── firebase.json           # Firebase deployment configuration
```


