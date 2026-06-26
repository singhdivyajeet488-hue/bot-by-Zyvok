import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player) {
      return interaction.editReply('❌ Nothing is currently playing!');
    }

    try {
      await player.stop();
      await interaction.editReply({
        embeds: [{
          color: 0xED4245,
          description: '⏹️ **Stopped** the music and cleared the queue',
          timestamp: new Date().toISOString(),
        }]
      });
    } catch (error) {
      logger.error('Stop command error:', error);
      await interaction.editReply('❌ An error occurred while stopping.');
    }
  },
};
