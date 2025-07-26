const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting ליצירת inbox
const createInboxLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 5, // מקסימום 5 inbox חדשים ל-IP
  message: { error: "Too many inboxes created. Try again in 15 minutes." },
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`➡️ ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Temp Mail server is running",
    version: "1.0.0",
    status: "healthy"
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// MongoDB connection (תיקון warnings)
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ Connected to MongoDB");
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// Routes
const inboxRoutes = require("./routes/inbox");
const webhookRoutes = require("./routes/webhook");
app.use("/inbox", createInboxLimiter, inboxRoutes);
app.use("/webhook", webhookRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Background cleanup (כל 5 דקות)
setInterval(async () => {
  try {
    const Inbox = require("./models/Inbox");
    const result = await Inbox.deleteMany({ 
      expiresAt: { $lt: new Date() } 
    });
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} expired inboxes`);
    }
  } catch (error) {
    console.error("❌ Cleanup error:", error);
  }
}, 5 * 60000);