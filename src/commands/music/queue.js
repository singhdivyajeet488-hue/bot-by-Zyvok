import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the current music queue')
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Page number')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const player = client.kazagumo.getPlayer(interaction.guildId);
    if (!player || !player.queue.length) {
      return interaction.editReply('❌ The queue is empty!');
    }

    const page = interaction.options.getInteger('page') || 1;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(player.queue.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, player.queue.length);

    const embed = new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle('📋 Music Queue')
      .setDescription(`Total: **${player.queue.length}** songs`);

    let queueText = '';
    for (let i = start; i < end; i++) {
      const track = player.queue[i];
      const position = i + 1;
      const duration = formatDuration(track.duration);
      queueText += `\`${position}.\` **[${track.title}](${track.url})** - \`${duration}\`\n`;
    }

    embed.addFields({
      name: `Current Page ${page}/${totalPages}`,
      value: queueText || 'No tracks on this page',
    });

    if (player.queue.current) {
      const current = player.queue.current;
      embed.addFields({
        name: '▶️ Now Playing',
        value: `[${current.title}](${current.url}) - \`${formatDuration(current.duration)}\``,
        inline: false,
      });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`queue_prev_${page}`)
          .setLabel('◀️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 1),
        new ButtonBuilder()
          .setCustomId(`queue_next_${page}`)
          .setLabel('▶️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
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
