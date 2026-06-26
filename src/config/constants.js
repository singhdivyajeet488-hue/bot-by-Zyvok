export const EMBED_COLORS = {
  primary: '#5865F2',
  success: '#57F287',
  warning: '#FEE75C',
  error: '#ED4245',
  info: '#5865F2',
  music: '#1DB954',
  level: '#FFA500',
  moderation: '#FF0000',
  ticket: '#00FFFF',
  starboard: '#FFD700',
};

export const PERMISSIONS = {
  ADMINISTRATOR: 'Administrator',
  MANAGE_GUILD: 'ManageGuild',
  MANAGE_CHANNELS: 'ManageChannels',
  MANAGE_ROLES: 'ManageRoles',
  KICK_MEMBERS: 'KickMembers',
  BAN_MEMBERS: 'BanMembers',
  MODERATE_MEMBERS: 'ModerateMembers',
  SEND_MESSAGES: 'SendMessages',
  MANAGE_MESSAGES: 'ManageMessages',
  VIEW_CHANNEL: 'ViewChannel',
  CONNECT: 'Connect',
  SPEAK: 'Speak',
  MUTE_MEMBERS: 'MuteMembers',
  DEAFEN_MEMBERS: 'DeafenMembers',
  MOVE_MEMBERS: 'MoveMembers',
};

export const MESSAGE_LIMITS = {
  maxLength: 2000,
  embedTitle: 256,
  embedDescription: 4096,
  embedField: 1024,
  embedFields: 25,
  embedFooter: 2048,
};

export const XP_CONFIG = {
  minPerMessage: 10,
  maxPerMessage: 25,
  cooldown: 60000,
  voiceXPMultiplier: 1.5,
  baseXP: 15,
};

export const MODERATION = {
  maxWarnings: 5,
  warningActions: ['mute', 'kick', 'ban'],
  defaultMuteDuration: 3600000,
  maxMuteDuration: 604800000,
};

export const MUSIC = {
  maxQueueSize: 500,
  maxPlaylistSize: 200,
  volume: 100,
  defaultVolume: 100,
  maxVolume: 150,
  defaultFilter: 'none',
};

export const TICKET = {
  maxTicketsPerUser: 5,
  closeTimeout: 60000,
  transcriptFormat: 'html',
};

export const GIVEAWAY = {
  maxDuration: 604800000,
  minDuration: 60000,
  defaultDuration: 86400000,
  maxWinners: 100,
  minWinners: 1,
};
