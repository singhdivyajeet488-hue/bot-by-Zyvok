import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import mongoose from 'mongoose';

import { logger } from './utils/logger.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { loadComponents } from './handlers/componentHandler.js';
import { initializeMusicSystem } from './handlers/musicHandler.js';
import { startWebServer } from './web/server.js';
import config from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildScheduledEvents,
      ],
      partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.ThreadMember,
      ],
    });

    this.client.commands = new Collection();
    this.client.cooldowns = new Collection();
    this.client.buttons = new Collection();
    this.client.selectMenus = new Collection();
    this.client.modals = new Collection();
    this.client.contextMenus = new Collection();
    this.client.music = null;
    this.client.db = null;
    this.client.logger = logger;
    this.client.config = config;

    this.isReady = false;
  }

  async initialize() {
    try {
      // Connect to MongoDB
      await this.connectDatabase();

      // Load handlers
      await this.loadHandlers();

      // Initialize music system
      if (config.features.music) {
        await this.initializeMusic();
      }

      // Start web server
      await startWebServer(this.client);

      // Login to Discord
      await this.client.login(process.env.DISCORD_TOKEN);

      this.isReady = true;
      logger.info('Bot initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize bot:', error);
      process.exit(1);
    }
  }

  async connectDatabase() {
    try {
      const mongoUri = process.env.NODE_ENV === 'production' 
        ? process.env.MONGODB_URI_PROD 
        : process.env.MONGODB_URI;

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      });

      this.client.db = mongoose.connection;
      logger.info('Connected to MongoDB');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async loadHandlers() {
    try {
      await loadCommands(this.client);
      await loadEvents(this.client);
      await loadComponents(this.client);
      logger.info('All handlers loaded successfully');
    } catch (error) {
      logger.error('Failed to load handlers:', error);
      throw error;
    }
  }

  async initializeMusic() {
    try {
      this.client.music = await initializeMusicSystem(this.client);
      logger.info('Music system initialized');
    } catch (error) {
      logger.error('Failed to initialize music system:', error);
      // Don't throw - allow bot to start without music
    }
  }

  async shutdown() {
    try {
      if (this.client.music) {
        await this.client.music.destroy();
      }
      await mongoose.connection.close();
      await this.client.destroy();
      logger.info('Bot shut down successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Handle process signals
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Start the bot
const bot = new DiscordBot();
bot.initialize();

export default bot;
