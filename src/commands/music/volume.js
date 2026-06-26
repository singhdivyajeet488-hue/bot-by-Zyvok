import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Adjust the music volume')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Volume level (0-150)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(150)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player) {
      return interaction.editReply('❌ Nothing is currently playing!');
    }

    const level = interaction.options.getInteger('level');

    try {
      if (level !== null) {
        await player.setVolume(level);
        await interaction.editReply({
          embeds: [{
            color: 0x1DB954,
            description: `🔊 **Volume** set to **${level}%**`,
            fields: [
              {
                name: 'Progress Bar',
                value: createProgressBar(level, 150),
                inline: false,
              }
            ],
            timestamp: new Date().toISOString(),
          }]
        });
      } else {
        await interaction.editReply({
          embeds: [{
            color: 0x1DB954,
            description: `🔊 Current volume: **${player.volume}%**`,
            fields: [
              {
                name: 'Progress Bar',
                value: createProgressBar(player.volume, 150),
                inline: false,
              }
            ],
          }]
        });
      }
    } catch (error) {
      logger.error('Volume command error:', error);
      await interaction.editReply('❌ An error occurred while adjusting volume.');
    }
  },
};

function createProgressBar(value, max) {
  const size = 20;
  const filled = Math.round((value / max) * size);
  const empty = size - filled;
  return '🔴'.repeat(filled) + '⚪'.repeat(empty) + ` ${value}%`;
}
