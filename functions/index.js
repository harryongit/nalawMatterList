const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Client } = require("@microsoft/microsoft-graph-client");
const msal = require("@azure/msal-node");
const cors = require("cors")({ origin: true }); // ✅ ADD THIS


admin.initializeApp();

const db = admin.firestore();


// MS Graph Configuration (Replace with actual values or use functions.config())
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MS_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MS_TENANT_ID}`,
    clientSecret: import.meta.env.VITE_MS_CLIENT_SEC,
  }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
  const tokenRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
  };
  const response = await cca.acquireTokenByClientCredential(tokenRequest);
  return response.accessToken;
}

exports.pushToCalendar = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  const { caseId, caseName, nextDate } = req.body;

  if (!caseId || !caseName || !nextDate) {
    return res.status(400).send("Missing required fields: caseId, caseName, nextDate");
  }

  try {
    const caseRef = db.collection("masterCases").doc(caseId);
    const caseDoc = await caseRef.get();

    if (!caseDoc.exists) {
      return res.status(404).send("Case not found");
    }

    const caseData = caseDoc.data();
    if (caseData.calendarSynced) {
      return res.status(400).send("Case already synced to calendar");
    }

    const accessToken = await getAccessToken();
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });

    const event = {
      subject: `Case: ${caseName}`,
      start: {
        dateTime: `${nextDate}T09:00:00`,
        timeZone: "India Standard Time",
      },
      end: {
        dateTime: `${nextDate}T10:00:00`,
        timeZone: "India Standard Time",
      },
      attendees: [
        {
          emailAddress: {
            address: "legal@nalaw.in",
            name: "Legal Team",
          },
          type: "required",
        },
      ],
    };

    // Replace 'me' with a specific user ID if using application permissions
    // For example: `/users/admin@yourdomain.com/calendar/events`
    const response = await client.api("/users/legal@nalaw.in/calendar/events").post(event);

    await caseRef.update({
      calendarSynced: true,
      eventId: response.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("caseLogs").add({
      caseId: caseId,
      action: "Pushed to Calendar",
      date: new Date().toISOString().split('T')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ success: true, eventId: response.id });
  } catch (error) {
    console.error("Error pushing to calendar:", error);
    res.status(500).send({ error: error.message });
  }
});
