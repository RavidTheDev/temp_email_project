// server/routes/inbox.js
console.log("✅ inbox.js route loaded");
const express = require("express");
const router = express.Router();
const Inbox = require("../models/Inbox");

// פונקציית כתובת רנדומלית
function generateRandomInbox(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// יצירת inbox חדש
router.post("/", async (req, res) => {
  console.log("📥 POST /inbox called");

  try {
    const address = generateRandomInbox();
    console.log("🧠 Generated address:", address);

    const domain = process.env.DOMAIN || "tempx.me";
    const expiresInMinutes = 10;

    const inbox = new Inbox({
      address: `${address}@${domain}`,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60000)
    });

    console.log("💾 Ready to save:", inbox);

    await inbox.save();

    console.log("✅ Inbox saved:", inbox.address);
    res.status(201).json({ 
      success: true,
      inbox: inbox.address,
      expiresAt: inbox.expiresAt
    });

  } catch (error) {
    console.error("❌ Error in POST /inbox:", error);
    
    // אם זה duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: "Inbox already exists, please try again" 
      });
    }
    
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// קבלת הודעות עבור inbox ספציפי
router.get("/:address", async (req, res) => {
  const { address } = req.params;
  console.log(`📬 GET /inbox/${address}`);

  try {
    // נבדק אם זה כולל כבר @ או לא
    const fullAddress = address.includes('@') ? address : `${address}@${process.env.DOMAIN || "tempx.me"}`;
    
    const inbox = await Inbox.findOne({ address: fullAddress });

    if (!inbox) {
      return res.status(404).json({ 
        error: "Inbox not found",
        address: fullAddress
      });
    }

    // עדכון lastAccessed
    inbox.lastAccessed = new Date();
    await inbox.save();

    res.json({ 
      success: true,
      address: inbox.address,
      messages: inbox.messages,
      expiresAt: inbox.expiresAt,
      messageCount: inbox.messages.length
    });

  } catch (err) {
    console.error("❌ Error in GET /inbox/:address", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// מחיקת inbox (אופציונלי)
router.delete("/:address", async (req, res) => {
  const { address } = req.params;
  console.log(`🗑️ DELETE /inbox/${address}`);

  try {
    const fullAddress = address.includes('@') ? address : `${address}@${process.env.DOMAIN || "tempx.me"}`;
    
    const result = await Inbox.deleteOne({ address: fullAddress });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        error: "Inbox not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Inbox deleted successfully" 
    });

  } catch (err) {
    console.error("❌ Error in DELETE /inbox/:address", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;