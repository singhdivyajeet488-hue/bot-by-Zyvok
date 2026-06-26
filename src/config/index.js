import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const config = {
  bot: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    owners: process.env.BOT_OWNERS?.split(',') || [],
    prefix: null, // No prefix commands
  },
  
  database: {
    uri: process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI,
  },

  lavalink: {
    nodes: [
      {
        name: 'main',
        host: process.env.LAVALINK_HOST || 'localhost',
        port: parseInt(process.env.LAVALINK_PORT) || 2333,
        password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
        secure: process.env.LAVALINK_SECURE === 'true',
      }
    ],
    options: {
      shards: 1,
      autoPlay: true,
      reconnectTimeout: 30000,
      reconnectTries: 10,
    }
  },

  web: {
    port: parseInt(process.env.WEB_PORT) || 3000,
    host: process.env.WEB_HOST || '0.0.0.0',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    channelId: process.env.LOG_CHANNEL_ID,
  },

  features: {
    music: process.env.ENABLE_MUSIC !== 'false',
    leveling: process.env.ENABLE_LEVELING !== 'false',
    tickets: process.env.ENABLE_TICKETS !== 'false',
    starboard: process.env.ENABLE_STARBOARD !== 'false',
    giveaways: process.env.ENABLE_GIVEAWAYS !== 'false',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  api: {
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    },
    genius: process.env.GENIUS_API_KEY,
    weather: process.env.WEATHER_API_KEY,
  },

  cooldowns: {
    default: 3000,
    music: 2000,
    moderation: 5000,
    admin: 1000,
  },

  pagination: {
    itemsPerPage: 10,
    timeout: 60000,
  },

  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
    music: '🎵',
    pause: '⏸️',
    resume: '▶️',
    skip: '⏭️',
    stop: '⏹️',
    shuffle: '🔀',
    repeat: '🔁',
    volume: '🔊',
    queue: '📋',
    lyrics: '📝',
    filter: '🎛️',
    star: '⭐',
    heart: '❤️',
    ticket: '🎫',
    settings: '⚙️',
    user: '👤',
    guild: '🏛️',
    boost: '🚀',
    verify: '✅',
    deny: '❌',
    pending: '⏳',
    level: '📊',
    rank: '🏆',
    medal: '🥇',
  },
};

export default config;
