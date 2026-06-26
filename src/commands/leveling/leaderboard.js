import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../database/models/User.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the server leaderboard')
    .addIntegerOption(option =>
      option.setName('page')
        .setDescription('Page number')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const page = interaction.options.getInteger('page') || 1;
    const itemsPerPage = 10;

    try {
      const allUsers = await User.find({})
        .sort({ 'leveling.totalXp': -1 })
        .lean();

      const totalPages = Math.ceil(allUsers.length / itemsPerPage);
      const start = (page - 1) * itemsPerPage;
      const end = Math.min(start + itemsPerPage, allUsers.length);

      const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('🏆 Server Leaderboard')
        .setDescription(`Page ${page}/${totalPages}`)
        .setTimestamp();

      let leaderboardText = '';
      for (let i = start; i < end; i++) {
        const user = allUsers[i];
        const rank = i + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        // Try to get username
        let username = 'Unknown User';
        try {
          const member = await client.users.fetch(user.userId);
          username = member.username;
        } catch (e) {
          // User not found
        }

        leaderboardText += `${medal} **${username}** - Level ${user.leveling.level} (${user.leveling.totalXp} XP)\n`;
      }

      embed.addFields({
        name: 'Top Members',
        value: leaderboardText || 'No users found',
        inline: false,
      });

      if (totalPages > 1) {
        embed.setFooter({ text: `Use /leaderboard page:${page + 1} to view more` });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Leaderboard command error:', error);
      await interaction.editReply('❌ An error occurred while fetching leaderboard.');
    }
  },
};
