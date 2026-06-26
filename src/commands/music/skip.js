import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song')
    .addIntegerOption(option =>
      option.setName('position')
        .setDescription('Skip to a specific position in queue')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.editReply('❌ Nothing is currently playing!');
    }

    const position = interaction.options.getInteger('position') || 0;

    try {
      let skipped = player.queue.current.title;
      
      if (position > 0) {
        if (position > player.queue.length) {
          return interaction.editReply('❌ That position doesn\'t exist in the queue!');
        }
        const index = position - 1;
        const track = player.queue[index];
        if (track) {
          player.queue.splice(0, index);
          skipped = track.title;
          await player.skip();
        }
      } else {
        await player.skip();
      }

      await interaction.editReply({
        embeds: [{
          color: 0x1DB954,
          description: `⏭️ **Skipped** the current song`,
          fields: [
            {
              name: 'Skipped',
              value: skipped || 'Unknown',
              inline: true,
            },
            {
              name: 'Up Next',
              value: player.queue.current?.title || 'Nothing in queue',
              inline: true,
            }
          ],
          timestamp: new Date().toISOString(),
        }]
      });
    } catch (error) {
      logger.error('Skip command error:', error);
      await interaction.editReply('❌ An error occurred while skipping.');
    }
  },
};
