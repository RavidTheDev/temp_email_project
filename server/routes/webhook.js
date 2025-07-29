// server/routes/webhook.js
const express = require("express");
const router = express.Router();
const Inbox = require("../models/Inbox");

// Webhook לקבלת אימיילים מ-Mailgun
router.post("/mailgun", async (req, res) => {
  console.log("📧 Received email webhook from Mailgun");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  try {
    // חילוץ נתונים מ-Mailgun webhook
    const {
      recipient,
      sender,
      subject,
      'body-plain': textBody,
      'body-html': htmlBody,
      timestamp,
      'Message-Id': messageId
    } = req.body;

    // בדיקה שיש נמען
    if (!recipient) {
      return res.status(400).json({ error: "No recipient found" });
    }

    console.log(`📬 Email for: ${recipient} from: ${sender}`);

    // חיפוש inbox קיים
    const inbox = await Inbox.findOne({ address: recipient });
    
    if (!inbox) {
      console.log(`❌ Inbox not found for ${recipient}`);
      return res.status(404).json({ error: "Inbox not found" });
    }

    // בדיקה אם האימייל פג תוקף
    if (inbox.isExpired()) {
      console.log(`⏰ Inbox expired for ${recipient}`);
      return res.status(410).json({ error: "Inbox expired" });
    }

    // יצירת הודעה חדשה
    const newMessage = {
      from: sender,
      subject: subject || "(No Subject)",
      text: textBody || "",
      html: htmlBody || "",
      date: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
      messageId: messageId,
      read: false
    };

    // הוספת ההודעה ל-inbox
    await inbox.addMessage(newMessage);

    console.log(`✅ Message added to ${recipient}`);

    res.status(200).json({ 
      success: true,
      message: "Email received and stored",
      inbox: recipient,
      messageCount: inbox.messages.length
    });

  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Webhook לקבלת אימיילים מ-SendGrid
router.post("/sendgrid", async (req, res) => {
  console.log("📧 Received email webhook from SendGrid");

  try {
    // SendGrid שולח array של אימיילים
    const emails = Array.isArray(req.body) ? req.body : [req.body];

    for (const email of emails) {
      const {
        to,
        from,
        subject,
        text,
        html,
        headers
      } = email;

      if (!to || !to[0]) continue;
      
      const recipient = to[0].email;
      console.log(`📬 Email for: ${recipient} from: ${from.email}`);

      // חיפוש inbox קיים
      const inbox = await Inbox.findOne({ address: recipient });
      
      if (!inbox || inbox.isExpired()) {
        console.log(`❌ Inbox not found or expired for ${recipient}`);
        continue;
      }

      // יצירת הודעה חדשה
      const newMessage = {
        from: from.email,
        subject: subject || "(No Subject)",
        text: text || "",
        html: html || "",
        date: new Date(),
        messageId: headers['Message-ID'],
        read: false
      };

      // הוספת ההודעה ל-inbox
      await inbox.addMessage(newMessage);
      console.log(`✅ Message added to ${recipient}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Error processing SendGrid webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Webhook גנרי לטסטים
router.post("/test", async (req, res) => {
  console.log("🧪 Test webhook received at:", new Date().toISOString());
  console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { to, from, subject, text, html } = req.body;

    if (!to) {
      console.log("❌ Missing 'to' field");
      return res.status(400).json({ error: "Missing 'to' field" });
    }

    console.log(`🔍 Looking for inbox: ${to}`);
    const inbox = await Inbox.findOne({ address: to });
    
    if (!inbox) {
      console.log(`❌ Inbox not found: ${to}`);
      return res.status(404).json({ error: "Inbox not found" });
    }

    console.log(`📬 Inbox found! Current messages: ${inbox.messages.length}`);

    const newMessage = {
      from: from || "test@example.com",
      subject: subject || `Test Message ${Date.now()}`,
      text: text || "This is a test message",
      html: html || "",
      date: new Date(),
      messageId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false
    };

    console.log("📧 Creating new message:", {
      from: newMessage.from,
      subject: newMessage.subject,
      messageId: newMessage.messageId
    });

    // שמירה ישירה במקום method
    inbox.messages.unshift(newMessage);
    inbox.lastAccessed = new Date();
    
    console.log(`💾 Saving inbox with ${inbox.messages.length} messages`);
    const savedInbox = await inbox.save();
    
    console.log(`✅ Inbox saved successfully! Total messages: ${savedInbox.messages.length}`);

    // אימות שההודעה נשמרה
    const verifyInbox = await Inbox.findOne({ address: to });
    console.log(`🔍 Verification: inbox now has ${verifyInbox.messages.length} messages`);

    res.status(200).json({ 
      success: true,
      message: "Test email added successfully",
      inbox: to,
      totalMessages: verifyInbox.messages.length,
      messageId: newMessage.messageId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET route לבדיקת webhook
router.get("/test", (req, res) => {
  res.json({ 
    message: "Webhook endpoint is working",
    endpoints: [
      "POST /webhook/mailgun - for Mailgun webhooks",
      "POST /webhook/sendgrid - for SendGrid webhooks", 
      "POST /webhook/test - for testing"
    ]
  });
});

module.exports = router;