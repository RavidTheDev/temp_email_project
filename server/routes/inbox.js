// server/routes/inbox.js
console.log("✅ inbox.js route loaded");
const express = require("express");
const router = express.Router();
const Inbox = require("../models/Inbox");

// פונקציית כתובת רנדומלית
function generateRandomInbox(length = 5) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

router.post("/", async (req, res) => {
  console.log("📥 POST /inbox called");

  try {
    const address = generateRandomInbox();
    console.log("🧠 Generated address:", address);

    const domain = "tempx.me";
    const expiresInMinutes = 10;

    const inbox = new Inbox({
      address: `${address}@${domain}`,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60000)
    });

    console.log("💾 Ready to save:", inbox);

    await inbox.save();

    console.log("✅ Inbox saved:", inbox.address);
    res.status(201).json({ inbox: inbox.address });

  } catch (error) {
    console.error("❌ Error in POST /inbox:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:address", async (req, res) => {
  const { address } = req.params;
  console.log(`📬 GET /inbox/${address}`);

  try {
    const inbox = await Inbox.findOne({ address: `${address}@tempx.me` });

    if (!inbox) {
      return res.status(404).json({ error: "Inbox not found" });
    }

    res.json({ messages: inbox.messages });
  } catch (err) {
    console.error("❌ Error in GET /inbox/:address", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
