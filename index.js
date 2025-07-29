const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Initialize Firebase Admin with service account
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ✅ Connect to MySQL
// const dbConfig = {
//   host: "localhost",
//   user: "root",
//   password: "1234",
//   database: "tokens",
// };
const dbConfig = {
  host: "sql12.freesqldatabase.com",
  user: "sql12792541",
  password: "GZ8zRUrftW",
  database: "sql12792541",
};

let db;
mysql
  .createConnection(dbConfig)
  .then((connection) => {
    db = connection;
    console.log("✅ MySQL connected");
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err);
  });

// ✅ Route to save token
app.post("/save-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "No token provided" });

  try {
    const [existing] = await db.execute(
      "SELECT * FROM fcm_tokens WHERE token = ?",
      [token]
    );
    if (existing.length === 0) {
      await db.execute("INSERT INTO fcm_tokens (token) VALUES (?)", [token]);
    }
    res.status(200).json({ message: "Token saved" });
  } catch (err) {
    console.error("❌ Error saving token:", err);
    res.status(500).json({ message: "Failed to save token" });
  }
});

// ✅ Send notification to single token
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

// ✅ Send notification to all saved tokens
app.post("/send-to-all", async (req, res) => {
  const { title, body } = req.body;
  try {
    const [rows] = await db.execute("SELECT token FROM fcm_tokens");
    const tokens = rows.map((row) => row.token);

    const message = {
      notification: { title, body },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log("✅ Notification sent:", response.successCount);
    res.json({ sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    console.error("❌ Failed to send:", error);
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
