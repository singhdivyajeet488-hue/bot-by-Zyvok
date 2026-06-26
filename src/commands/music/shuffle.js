import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the music queue'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player || !player.queue.length) {
      return interaction.editReply('❌ The queue is empty!');
    }

    try {
      player.queue = shuffleArray(player.queue);
      
      await interaction.editReply({
        embeds: [{
          color: 0x1DB954,
          description: '🔀 **Shuffled** the queue',
          fields: [
            {
              name: 'Total Songs',
              value: `${player.queue.length}`,
              inline: true,
            }
          ],
          timestamp: new Date().toISOString(),
        }]
      });
    } catch (error) {
      logger.error('Shuffle command error:', error);
      await interaction.editReply('❌ An error occurred while shuffling.');
    }
  },
};

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
