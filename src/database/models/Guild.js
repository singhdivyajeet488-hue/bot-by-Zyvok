import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: String,
  icon: String,
  ownerId: String,
  memberCount: Number,
  
  // Moderation Settings
  moderation: {
    logs: {
      channelId: String,
      enabled: {
        type: Boolean,
        default: true,
      },
    },
    autoMod: {
      enabled: {
        type: Boolean,
        default: true,
      },
      thresholds: {
        spam: {
          type: Number,
          default: 5,
        },
        mentions: {
          type: Number,
          default: 3,
        },
        caps: {
          type: Number,
          default: 70,
        },
        emojis: {
          type: Number,
          default: 10,
        },
      },
      punishments: {
        warn: {
          type: Boolean,
          default: true,
        },
        mute: {
          type: Boolean,
          default: true,
        },
        timeout: {
          type: Boolean,
          default: true,
        },
        kick: {
          type: Boolean,
          default: false,
        },
        ban: {
          type: Boolean,
          default: false,
        },
      },
      ignored: {
        channels: [String],
        roles: [String],
        users: [String],
      },
    },
    warnings: {
      maxWarnings: {
        type: Number,
        default: 5,
      },
      action: {
        type: String,
        enum: ['warn', 'mute', 'kick', 'ban'],
        default: 'warn',
      },
    },
  },

  // Leveling Settings
  leveling: {
    enabled: {
      type: Boolean,
      default: true,
    },
    xpCooldown: {
      type: Number,
      default: 60000,
    },
    xpPerMessage: {
      min: {
        type: Number,
        default: 10,
      },
      max: {
        type: Number,
        default: 25,
      },
    },
    voiceXpMultiplier: {
      type: Number,
      default: 1.5,
    },
    ignoreChannels: [String],
    ignoreRoles: [String],
    levelRoles: [
      {
        level: Number,
        roleId: String,
      },
    ],
    multipliers: [
      {
        roleId: String,
        multiplier: Number,
      },
    ],
    doubleXp: {
      enabled: {
        type: Boolean,
        default: false,
      },
      endTime: Date,
    },
  },

  // Music Settings
  music: {
    enabled: {
      type: Boolean,
      default: true,
    },
    volume: {
      type: Number,
      default: 100,
      min: 0,
      max: 150,
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
    announce: {
      type: Boolean,
      default: true,
    },
    maxQueueSize: {
      type: Number,
      default: 500,
    },
    allowedRoles: [String],
  },

  // Ticket Settings
  tickets: {
    enabled: {
      type: Boolean,
      default: true,
    },
    categories: [
      {
        name: String,
        emoji: String,
        roleId: String,
        description: String,
      },
    ],
    maxTicketsPerUser: {
      type: Number,
      default: 5,
    },
    closedTimeout: {
      type: Number,
      default: 60000,
    },
    transcriptChannelId: String,
    logChannelId: String,
  },

  // Welcome Settings
  welcome: {
    enabled: {
      type: Boolean,
      default: true,
    },
    channelId: String,
    message: String,
    embed: {
      title: String,
      description: String,
      color: String,
      thumbnail: Boolean,
    },
    autoRoleId: String,
    autoNickname: String,
    captcha: {
      enabled: Boolean,
      channelId: String,
    },
    goodbye: {
      enabled: Boolean,
      default: true,
    },
    dmWelcome: {
      enabled: Boolean,
      default: false,
    },
  },

  // Reaction Roles
  reactionRoles: [
    {
      messageId: String,
      channelId: String,
      roles: [
        {
          emoji: String,
          roleId: String,
          type: {
            type: String,
            enum: ['button', 'dropdown', 'single', 'multi'],
            default: 'button',
          },
        },
      ],
    },
  ],

  // Starboard
  starboard: {
    enabled: {
      type: Boolean,
      default: true,
    },
    channelId: String,
    emoji: {
      type: String,
      default: '⭐',
    },
    minimumReactions: {
      type: Number,
      default: 5,
    },
    ignoreChannels: [String],
  },

  // Suggestions
  suggestions: {
    enabled: {
      type: Boolean,
      default: true,
    },
    channelId: String,
    autoApprove: {
      type: Boolean,
      default: false,
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    logChannelId: String,
  },

  // Giveaways
  giveaways: {
    enabled: {
      type: Boolean,
      default: true,
    },
    channelId: String,
    requireRole: String,
    maxEntries: Number,
  },

  // Voice Channels
  temporaryChannels: {
    enabled: Boolean,
    categoryId: String,
    channelId: String,
    voiceChannelName: {
      type: String,
      default: '🔊 Temporary Voice',
    },
    maxUsers: Number,
    bitrate: Number,
  },

  // AutoMod
  automod: {
    enabled: {
      type: Boolean,
      default: true,
    },
    rules: [
      {
        name: String,
        type: {
          type: String,
          enum: ['spam', 'invite', 'link', 'scam', 'ghostping', 'caps', 'mention', 'emoji', 'profanity', 'massjoin', 'raid'],
        },
        action: {
          type: String,
          enum: ['warn', 'mute', 'timeout', 'kick', 'ban', 'delete'],
          default: 'warn',
        },
        duration: Number,
        threshold: Number,
        ignoreRoles: [String],
        ignoreChannels: [String],
        enabled: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },

  // Custom Commands
  customCommands: [
    {
      name: String,
      content: String,
      embed: {
        title: String,
        description: String,
        color: String,
        fields: [
          {
            name: String,
            value: String,
            inline: Boolean,
          },
        ],
      },
      buttons: [
        {
          label: String,
          url: String,
          style: String,
          emoji: String,
        },
      ],
      cooldown: Number,
    },
  ],

  // AFK
  afk: [
    {
      userId: String,
      message: String,
      timestamp: Date,
      channelId: String,
    },
  ],

  // Server Stats
  stats: {
    enabled: {
      type: Boolean,
      default: true,
    },
    channels: {
      members: String,
      bots: String,
      humans: String,
      boosts: String,
      voice: String,
      online: String,
    },
  },

  // Logging
  logging: {
    channelId: String,
    events: {
      messageDelete: {
        type: Boolean,
        default: true,
      },
      messageEdit: {
        type: Boolean,
        default: true,
      },
      roleCreate: {
        type: Boolean,
        default: true,
      },
      roleDelete: {
        type: Boolean,
        default: true,
      },
      roleUpdate: {
        type: Boolean,
        default: true,
      },
      channelCreate: {
        type: Boolean,
        default: true,
      },
      channelDelete: {
        type: Boolean,
        default: true,
      },
      channelUpdate: {
        type: Boolean,
        default: true,
      },
      threadCreate: {
        type: Boolean,
        default: true,
      },
      threadDelete: {
        type: Boolean,
        default: true,
      },
      threadUpdate: {
        type: Boolean,
        default: true,
      },
      voiceJoin: {
        type: Boolean,
        default: true,
      },
      voiceLeave: {
        type: Boolean,
        default: true,
      },
      voiceMove: {
        type: Boolean,
        default: true,
      },
      voiceMute: {
        type: Boolean,
        default: true,
      },
      voiceUnmute: {
        type: Boolean,
        default: true,
      },
      voiceDeafen: {
        type: Boolean,
        default: true,
      },
      memberJoin: {
        type: Boolean,
        default: true,
      },
      memberLeave: {
        type: Boolean,
        default: true,
      },
      memberKick: {
        type: Boolean,
        default: true,
      },
      memberBan: {
        type: Boolean,
        default: true,
      },
      memberUnban: {
        type: Boolean,
        default: true,
      },
      memberTimeout: {
        type: Boolean,
        default: true,
      },
      nicknameChange: {
        type: Boolean,
        default: true,
      },
      roleAdded: {
        type: Boolean,
        default: true,
      },
      roleRemoved: {
        type: Boolean,
        default: true,
      },
      boost: {
        type: Boolean,
        default: true,
      },
      boostRemove: {
        type: Boolean,
        default: true,
      },
      commandUsage: {
        type: Boolean,
        default: true,
      },
      botError: {
        type: Boolean,
        default: true,
      },
      musicEvent: {
        type: Boolean,
        default: true,
      },
      warning: {
        type: Boolean,
        default: true,
      },
      ticketAction: {
        type: Boolean,
        default: true,
      },
      starboardEvent: {
        type: Boolean,
        default: true,
      },
      suggestionEvent: {
        type: Boolean,
        default: true,
      },
      reactionRoleEvent: {
        type: Boolean,
        default: true,
      },
    },
  },

  // Economy (future ready)
  economy: {
    enabled: {
      type: Boolean,
      default: true,
    },
    currency: {
      name: {
        type: String,
        default: 'Coins',
      },
      symbol: {
        type: String,
        default: '🪙',
      },
    },
  },

  // Temporary Channels
  tempChannels: [
    {
      userId: String,
      channelId: String,
      voiceChannelId: String,
      createdAt: Date,
    },
  ],

}, {
  timestamps: true,
});

// Indexes
guildSchema.index({ guildId: 1 });
guildSchema.index({ 'reactionRoles.messageId': 1 });
guildSchema.index({ 'customCommands.name': 1 });

const Guild = mongoose.model('Guild', guildSchema);

export default Guild;
