const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Initialize Firebase Admin with service account
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✅ API to send notification
app.post("/send-notification", async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    token,
    notification: {
      title,
      body,
    },
    webpush: {
      notification: {
        title,
        body,
        icon: "https://newbackendcode.onrender.com/logo192.png", // ✅ Must be full URL
        click_action: "https://newbackendcode.onrender.com", // ✅ Must be full URL
      },
      fcmOptions: {
        link: "https://newbackendcode.onrender.com", // ✅ Android Chrome requires this for correct click behavior
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Message sent successfully:", response);
    res.status(200).json({ success: true, response });
  } catch (err) {
    console.error("❌ Error sending notification:", err);
    res.status(500).json({ error: "Notification failed.", err });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
