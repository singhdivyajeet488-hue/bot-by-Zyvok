import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a specific position in the current song')
    .addStringOption(option =>
      option.setName('position')
        .setDescription('Position (e.g., 1:30, 2m, 90s)')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.editReply('❌ Nothing is currently playing!');
    }

    const positionStr = interaction.options.getString('position');
    const positionMs = parseTime(positionStr);

    if (positionMs === null || positionMs > player.queue.current.duration) {
      return interaction.editReply('❌ Invalid position! Please use format like: 1:30, 2m, 90s');
    }

    try {
      await player.seek(positionMs);
      
      await interaction.editReply({
        embeds: [{
          color: 0x1DB954,
          description: `⏩ **Seeked** to ${formatDuration(positionMs)}`,
          fields: [
            {
              name: 'Current Song',
              value: player.queue.current.title,
              inline: true,
            },
            {
              name: 'Duration',
              value: formatDuration(player.queue.current.duration),
              inline: true,
            }
          ],
          timestamp: new Date().toISOString(),
        }]
      });
    } catch (error) {
      logger.error('Seek command error:', error);
      await interaction.editReply('❌ An error occurred while seeking.');
    }
  },
};

function parseTime(str) {
  const match = str.match(/^(\d+)(?::(\d+))?(?::(\d+))?$/);
  if (match) {
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  const match2 = str.match(/^(\d+)([ms])$/);
  if (match2) {
    const num = parseInt(match2[1]);
    const unit = match2[2];
    if (unit === 'm') return num * 60000;
    if (unit === 's') return num * 1000;
  }

  return null;
}

function formatDuration(ms) {
  if (!ms || ms < 0) return '0:00';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
