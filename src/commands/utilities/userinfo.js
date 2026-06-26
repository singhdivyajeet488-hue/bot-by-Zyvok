import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get info about')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild.members.cache.get(targetUser.id);
    
    if (!member) {
      return interaction.editReply('❌ User not found in this server!');
    }

    try {
      const embed = new EmbedBuilder()
        .setColor(member.displayHexColor || 0x5865F2)
        .setTitle('👤 User Information')
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
          {
            name: '📛 Username',
            value: targetUser.tag,
            inline: true,
          },
          {
            name: '🆔 User ID',
            value: targetUser.id,
            inline: true,
          },
          {
            name: '📅 Joined Server',
            value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
            inline: true,
          },
          {
            name: '📅 Joined Discord',
            value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`,
            inline: true,
          },
          {
            name: '🎭 Roles',
            value: member.roles.cache
              .filter(r => r.id !== interaction.guild.id)
              .map(r => r.toString())
              .join(', ') || 'No roles',
            inline: false,
          },
          {
            name: '📊 Status',
            value: member.presence?.status || 'Offline',
            inline: true,
          },
          {
            name: '📱 Activities',
            value: member.presence?.activities.map(a => a.name).join(', ') || 'None',
            inline: true,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      if (member.displayAvatarURL({ dynamic: true, size: 512 })) {
        embed.setImage(member.displayAvatarURL({ dynamic: true, size: 512 }));
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Userinfo command error:', error);
      await interaction.editReply('❌ An error occurred while fetching user information.');
    }
  },
};
