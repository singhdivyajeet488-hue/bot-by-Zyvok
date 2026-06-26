import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';
import Guild from '../../database/models/Guild.js';

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure the bot settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a configuration value')
        .addStringOption(option =>
          option.setName('key')
            .setDescription('Configuration key')
            .setRequired(true)
            .addChoices(
              { name: 'Log Channel', value: 'moderation.logs.channelId' },
              { name: 'Welcome Channel', value: 'welcome.channelId' },
              { name: 'Welcome Message', value: 'welcome.message' },
              { name: 'Auto Role', value: 'welcome.autoRoleId' },
              { name: 'Tickets Enabled', value: 'tickets.enabled' },
              { name: 'Leveling Enabled', value: 'leveling.enabled' },
              { name: 'Music Enabled', value: 'music.enabled' },
              { name: 'Starboard Enabled', value: 'starboard.enabled' },
            )
        )
        .addStringOption(option =>
          option.setName('value')
            .setDescription('Value to set')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription('Show current configuration')
    ),

  permissions: ['Administrator'],

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set') {
      await this.setConfig(interaction, client);
    } else if (subcommand === 'show') {
      await this.showConfig(interaction, client);
    }
  },

  async setConfig(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const key = interaction.options.getString('key');
    const value = interaction.options.getString('value');

    try {
      let guildData = await Guild.findOne({ guildId: interaction.guildId });
      if (!guildData) {
        guildData = new Guild({ guildId: interaction.guildId });
      }

      // Parse value
      let parsedValue = value;
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      else if (value === 'null') parsedValue = null;
      else if (value === 'undefined') parsedValue = undefined;

      // Set value using dot notation
      const keys = key.split('.');
      let current = guildData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = parsedValue;

      await guildData.save();

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('✅ Configuration Updated')
        .addFields(
          {
            name: 'Setting',
            value: key,
            inline: true,
          },
          {
            name: 'Value',
            value: String(parsedValue),
            inline: true,
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Config set error:', error);
      await interaction.editReply('❌ An error occurred while updating configuration.');
    }
  },

  async showConfig(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guildData = await Guild.findOne({ guildId: interaction.guildId });
      if (!guildData) {
        return interaction.editReply('❌ No configuration found for this server.');
      }

      const config = guildData.toObject();
      delete config._id;
      delete config.guildId;
      delete config.__v;

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('⚙️ Server Configuration')
        .setDescription('Current bot settings for this server')
        .setTimestamp();

      // Format config into fields
      const formatValue = (value) => {
        if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        }
        return String(value);
      };

      const fields = Object.entries(config).map(([key, value]) => ({
        name: key,
        value: formatValue(value).slice(0, 1024) || 'Empty',
        inline: false,
      }));

      embed.addFields(fields);

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Config show error:', error);
      await interaction.editReply('❌ An error occurred while fetching configuration.');
    }
  },
};
