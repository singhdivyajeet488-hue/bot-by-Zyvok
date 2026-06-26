import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused music'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player) {
      return interaction.editReply('❌ Nothing is currently playing!');
    }

    if (player.playing) {
      return interaction.editReply('❌ The music is already playing!');
    }

    try {
      await player.resume();
      await interaction.editReply({
        embeds: [{
          color: 0x1DB954,
          description: '▶️ **Resumed** the music',
          fields: [
            {
              name: 'Current Song',
              value: player.queue.current?.title || 'Unknown',
            }
          ],
          timestamp: new Date().toISOString(),
        }]
      });
    } catch (error) {
      logger.error('Resume command error:', error);
      await interaction.editReply('❌ An error occurred while resuming.');
    }
  },
};
