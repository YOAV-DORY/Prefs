// server.js

// express (אקספרס) = ספרייה לבניית שרת HTTP פשוט
const express = require("express");

// fs (אפס-אס) = עבודה עם קבצים במערכת
const fs = require("fs");

// path (פּאת') = בניית מסלולי קבצים בצורה אחידה
const path = require("path");

const app = express();

// PORT (פורט) = מספר "שער" שעליו השרת מקשיב
const PORT = process.env.PORT || 3000;

// PREFS_API_KEY = מפתח סודי שהפלטפורמות יצטרכו כדי לקרוא ל-API
const PREFS_API_KEY = process.env.PREFS_API_KEY || "dev-local-key";

// parsing של גוף הבקשה בפורמט JSON
app.use(express.json());

/**
 * פונקציה שטוענת את ההעדפות מקובץ prefs-profile.json
 * כרגע: כל המשתמשים מקבלים אותו פרופיל.
 * בעתיד: אפשר למשוך לפי userId מבסיס נתונים.
 */
function loadPreferencesFromFile() {
  const raw = fs.readFileSync(path.join(__dirname, "prefs-profile.json"), "utf8");
  const data = JSON.parse(raw);
  return data;
}

/**
 * Middleware (מידלוור = קטע קוד שרץ לפני שמגיעים לנתיב)
 * שבודק מפתח API שמגיע מהלקוח.
 */
function authMiddleware(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== PREFS_API_KEY) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing API key" });
  }

  next();
}

// health check (צ'ק בריאות) - לראות שהשרת חי
app.get("/health", (req, res) => {
  res.json({ status: "ok", port: PORT });
});

/**
 * GET /v1/preferences/:userId
 * מחזיר את פרופיל ההעדפות עבור userId נתון.
 * כרגע: אותו פרופיל לכולם, אבל זה מספיק ל-MVP.
 */
app.get("/v1/preferences/:userId", authMiddleware, (req, res) => {
  try {
    const userId = req.params.userId;
    const prefs = loadPreferencesFromFile();

    const responseBody = {
      user_id: userId,
      ...prefs,
    };

    res.json(responseBody);
  } catch (err) {
    console.error("Error loading preferences:", err);
    res.status(500).json({ error: "Failed to load preferences" });
  }
});

/**
 * חשיפת קובץ openapi.yaml לצרכי Actions של ChatGPT
 */
app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// מפעיל את השרת
app.listen(PORT, () => {
  console.log(`Prefs API server is running on http://localhost:${PORT}`);
  console.log(`Using PREFS_API_KEY = ${PREFS_API_KEY}`);
});
