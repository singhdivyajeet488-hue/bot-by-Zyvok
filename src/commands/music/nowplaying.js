import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show information about the current song'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player || !player.queue.current) {
      return interaction.editReply('❌ Nothing is currently playing!');
    }

    const track = player.queue.current;
    const position = player.position || 0;
    const duration = track.duration || 0;
    const progress = Math.min((position / duration) * 100, 100);
    const progressBar = createProgressBar(progress, 20);

    const embed = new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle('🎵 Now Playing')
      .setDescription(`[**${track.title}**](${track.url})`)
      .setThumbnail(track.thumbnail || null)
      .addFields(
        {
          name: '⏱️ Progress',
          value: `${progressBar}\n${formatDuration(position)} / ${formatDuration(duration)}`,
          inline: false,
        },
        {
          name: '👤 Requested by',
          value: track.requester ? `<@${track.requester}>` : 'Unknown',
          inline: true,
        },
        {
          name: '🔊 Volume',
          value: `${player.volume}%`,
          inline: true,
        },
        {
          name: '🔁 Loop Mode',
          value: player.loop ? 'Enabled' : 'Disabled',
          inline: true,
        },
        {
          name: '📋 Queue Length',
          value: `${player.queue.length} songs`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

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

function createProgressBar(percent, size) {
  const filled = Math.round((percent / 100) * size);
  const empty = size - filled;
  return '🔴'.repeat(filled) + '⚪'.repeat(empty);
}
