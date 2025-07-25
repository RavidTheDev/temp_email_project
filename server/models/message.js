const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  inboxId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inbox',
    required: true
  },
  from: String,
  subject: String,
  body: String,
  receivedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);
