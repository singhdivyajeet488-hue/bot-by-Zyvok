import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get information about the server'),

  async execute(interaction, client) {
    await interaction.deferReply();

    const guild = interaction.guild;

    try {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🏛️ ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
        .addFields(
          {
            name: '📛 Server Name',
            value: guild.name,
            inline: true,
          },
          {
            name: '🆔 Server ID',
            value: guild.id,
            inline: true,
          },
          {
            name: '👑 Owner',
            value: (await guild.fetchOwner()).user.tag,
            inline: true,
          },
          {
            name: '📅 Created',
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
            inline: true,
          },
          {
            name: '👥 Members',
            value: `${guild.memberCount} members`,
            inline: true,
          },
          {
            name: '💬 Channels',
            value: `${guild.channels.cache.size} total`,
            inline: true,
          },
          {
            name: '🎭 Roles',
            value: `${guild.roles.cache.size} roles`,
            inline: true,
          },
          {
            name: '🚀 Boosts',
            value: `${guild.premiumSubscriptionCount || 0} boosts (Level ${guild.premiumTier})`,
            inline: true,
          },
          {
            name: '🌐 Verification Level',
            value: `${guild.verificationLevel}`,
            inline: true,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      if (guild.bannerURL()) {
        embed.setImage(guild.bannerURL({ size: 1024 }));
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Serverinfo command error:', error);
      await interaction.editReply('❌ An error occurred while fetching server information.');
    }
  },
};
