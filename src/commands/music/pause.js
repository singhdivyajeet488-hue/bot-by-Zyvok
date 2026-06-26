import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player) {
      return interaction.editReply('❌ Nothing is currently playing!');
    }

    if (!player.playing) {
      return interaction.editReply('❌ The music is already paused!');
    }

    try {
      await player.pause();
      await interaction.editReply({
        embeds: [{
          color: 0x1DB954,
          description: '⏸️ **Paused** the music',
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
      logger.error('Pause command error:', error);
      await interaction.editReply('❌ An error occurred while pausing.');
    }
  },
};
