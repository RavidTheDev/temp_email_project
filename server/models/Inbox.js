const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  from: { 
    type: String, 
    required: true,
    trim: true 
  },
  subject: { 
    type: String, 
    default: "(No Subject)",
    trim: true 
  },
  text: { 
    type: String, 
    default: "" 
  },
  html: { 
    type: String, 
    default: "" 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  messageId: String,
  read: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

const inboxSchema = new mongoose.Schema({
  address: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address']
  },
  messages: [messageSchema],
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 10 * 60000) // 10 דקות
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  lastAccessed: { 
    type: Date, 
    default: Date.now 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

// Indexes
inboxSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Pre-save middleware
inboxSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.messages.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  next();
});

// Methods
inboxSchema.methods.addMessage = function(messageData) {
  this.messages.unshift(messageData);
  this.lastAccessed = new Date();
  return this.save();
};

inboxSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

inboxSchema.methods.getUnreadCount = function() {
  return this.messages.filter(msg => !msg.read).length;
};

module.exports = mongoose.model("Inbox", inboxSchema);