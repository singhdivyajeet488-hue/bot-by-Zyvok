import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { REST, Routes, Collection } from 'discord.js';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const loadCommands = async (client) => {
  const commands = [];
  const commandPath = join(__dirname, '../commands');

  try {
    // Walk through command directories recursively
    const walkDir = (dir) => {
      const files = readdirSync(dir);
      for (const file of files) {
        const filePath = join(dir, file);
        const stats = statSync(filePath);
        
        if (stats.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.js') && !file.startsWith('_')) {
          commands.push(filePath);
        }
      }
    };

    walkDir(commandPath);

    // Load each command
    for (const filePath of commands) {
      try {
        const command = await import(`file://${filePath}`);
        const commandData = command.default || command;
        
        if (!commandData.data || !commandData.execute) {
          logger.warn(`Command ${filePath} is missing data or execute function`);
          continue;
        }

        // Add command to collection
        const commandName = commandData.data.name;
        client.commands.set(commandName, commandData);

        // Add to slash commands list
        if (commandData.data.toJSON) {
          client.commandList = client.commandList || [];
          client.commandList.push(commandData.data.toJSON());
        }

        logger.info(`Loaded command: ${commandName} from ${filePath}`);

      } catch (error) {
        logger.error(`Failed to load command from ${filePath}:`, error);
      }
    }

    // Register slash commands
    await registerSlashCommands(client);

    logger.info(`Loaded ${client.commands.size} commands`);
    return client.commands;

  } catch (error) {
    logger.error('Failed to load commands:', error);
    throw error;
  }
};

const registerSlashCommands = async (client) => {
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    // Global commands
    const globalCommands = client.commandList || [];

    if (globalCommands.length > 0) {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: globalCommands }
      );
      logger.info('Registered global slash commands');
    }

  } catch (error) {
    logger.error('Failed to register slash commands:', error);
  }
};

export const executeCommand = async (interaction, client) => {
  try {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return interaction.reply({
        content: '❌ This command is no longer available.',
        ephemeral: true,
      });
    }

    // Check permissions
    const requiredPermissions = command.permissions || [];
    if (requiredPermissions.length > 0) {
      const missingPermissions = requiredPermissions.filter(
        perm => !interaction.member.permissions.has(perm)
      );

      if (missingPermissions.length > 0) {
        return interaction.reply({
          content: `❌ You don't have the required permissions: ${missingPermissions.join(', ')}`,
          ephemeral: true,
        });
      }
    }

    // Check bot permissions
    const botPermissions = command.botPermissions || [];
    if (botPermissions.length > 0) {
      const missingBotPermissions = botPermissions.filter(
        perm => !interaction.guild.members.me.permissions.has(perm)
      );

      if (missingBotPermissions.length > 0) {
        return interaction.reply({
          content: `❌ I don't have the required permissions: ${missingBotPermissions.join(', ')}`,
          ephemeral: true,
        });
      }
    }

    // Check cooldowns
    const cooldownAmount = command.cooldown || config.cooldowns.default;
    const cooldownKey = `${interaction.user.id}-${interaction.commandName}`;
    
    if (client.cooldowns.has(cooldownKey)) {
      const expirationTime = client.cooldowns.get(cooldownKey);
      const timeLeft = (expirationTime - Date.now()) / 1000;
      
      if (timeLeft > 0) {
        return interaction.reply({
          content: `⏳ Please wait ${Math.ceil(timeLeft)} seconds before using this command again.`,
          ephemeral: true,
        });
      }
    }

    // Set cooldown
    client.cooldowns.set(cooldownKey, Date.now() + cooldownAmount);
    setTimeout(() => client.cooldowns.delete(cooldownKey), cooldownAmount);

    // Check NSFW
    if (command.nsfw && !interaction.channel.nsfw) {
      return interaction.reply({
        content: '❌ This command can only be used in NSFW channels.',
        ephemeral: true,
      });
    }

    // Check guild only
    if (command.guildOnly && !interaction.inGuild()) {
      return interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
    }

    // Check owner only
    if (command.ownerOnly && !config.bot.owners.includes(interaction.user.id)) {
      return interaction.reply({
        content: '❌ This command is only available to bot owners.',
        ephemeral: true,
      });
    }

    // Execute command
    await command.execute(interaction, client);

    // Log command usage
    if (client.logger) {
      client.logger.info(`Command executed: ${interaction.commandName} by ${interaction.user.tag} (${interaction.user.id})`);
    }

  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: '❌ An error occurred while executing this command.',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: '❌ An error occurred while executing this command.',
          ephemeral: true,
        });
      }
    } catch (replyError) {
      logger.error('Failed to send error response:', replyError);
    }
  }
};
