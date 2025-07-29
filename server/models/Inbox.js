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
  console.log(`💾 Saving inbox with ${this.messages.length} messages`);
  next(); // הסרתי את המיון כי זה יכול לגרום לבעיות
});

// Methods
inboxSchema.methods.addMessage = function(messageData) {
  // הוספה בהתחלה (unshift במקום push)
  this.messages.unshift({
    ...messageData,
    _id: new mongoose.Types.ObjectId(), // ID ייחודי לכל הודעה
    date: messageData.date || new Date()
  });
  
  this.lastAccessed = new Date();
  
  console.log(`📬 Adding message. Total messages now: ${this.messages.length}`);
  return this.save();
};

inboxSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

inboxSchema.methods.getUnreadCount = function() {
  return this.messages.filter(msg => !msg.read).length;
};

module.exports = mongoose.model("Inbox", inboxSchema);