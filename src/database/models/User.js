import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  username: String,
  discriminator: String,
  avatar: String,
  
  // Leveling
  leveling: {
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 0,
    },
    totalXp: {
      type: Number,
      default: 0,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    voiceTime: {
      type: Number,
      default: 0,
    },
    lastMessage: Date,
    lastVoice: Date,
    rank: Number,
  },

  // Warnings
  warnings: [
    {
      guildId: String,
      reason: String,
      moderatorId: String,
      timestamp: Date,
      caseId: Number,
    },
  ],

  // Economy (future ready)
  economy: {
    balance: {
      type: Number,
      default: 0,
    },
    bank: {
      type: Number,
      default: 0,
    },
    inventory: [
      {
        itemId: String,
        quantity: Number,
      },
    ],
    daily: {
      lastClaim: Date,
      streak: Number,
    },
  },

  // AFK
  afk: {
    message: String,
    timestamp: Date,
    guildId: String,
  },

  // Music
  music: {
    favorites: [
      {
        track: {
          title: String,
          url: String,
          duration: Number,
          thumbnail: String,
          author: String,
        },
        addedAt: Date,
      },
    ],
  },

  // Tickets
  tickets: [
    {
      guildId: String,
      channelId: String,
      category: String,
      createdAt: Date,
      closedAt: Date,
      closedBy: String,
      transcript: String,
    },
  ],

  // Giveaways
  giveaways: [
    {
      guildId: String,
      messageId: String,
      entries: Number,
      won: Boolean,
      createdAt: Date,
      endedAt: Date,
    },
  ],

  // Blacklist
  blacklisted: {
    type: Boolean,
    default: false,
  },
  blacklistReason: String,
  blacklistDate: Date,

}, {
  timestamps: true,
});

// Indexes
userSchema.index({ userId: 1 });
userSchema.index({ 'leveling.level': -1 });
userSchema.index({ 'leveling.xp': -1 });
userSchema.index({ 'economy.balance': -1 });

// Methods
userSchema.methods.addXP = async function(guildId, amount) {
  this.leveling.xp += amount;
  this.leveling.totalXp += amount;
  
  // Check for level up
  const xpNeeded = this.getXPNeeded(this.leveling.level);
  while (this.leveling.xp >= xpNeeded) {
    this.leveling.xp -= xpNeeded;
    this.leveling.level += 1;
  }
  
  await this.save();
  return this.leveling;
};

userSchema.methods.getXPNeeded = function(level) {
  return Math.floor(100 * Math.pow(1.1, level));
};

userSchema.methods.addWarning = function(guildId, reason, moderatorId) {
  this.warnings.push({
    guildId,
    reason,
    moderatorId,
    timestamp: new Date(),
    caseId: this.warnings.length + 1,
  });
  return this.save();
};

userSchema.methods.getWarnings = function(guildId) {
  return this.warnings.filter(w => w.guildId === guildId);
};

userSchema.methods.clearWarnings = function(guildId) {
  this.warnings = this.warnings.filter(w => w.guildId !== guildId);
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
