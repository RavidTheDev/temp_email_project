const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  from: String,
  subject: String,
  text: String,
  date: { type: Date, default: Date.now }
});

const inboxSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  messages: [messageSchema],
  expiresAt: Date
});

module.exports = mongoose.model("Inbox", inboxSchema);
