import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';
import Guild from '../../database/models/Guild.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('delete_messages')
        .setDescription('Delete messages from the user')
        .setRequired(false)
        .addChoices(
          { name: 'None', value: '0' },
          { name: '1 Hour', value: '3600' },
          { name: '6 Hours', value: '21600' },
          { name: '12 Hours', value: '43200' },
          { name: '24 Hours', value: '86400' },
          { name: '7 Days', value: '604800' },
        )
    ),

  permissions: ['BanMembers'],
  botPermissions: ['BanMembers'],

  async execute(interaction, client) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteMessages = parseInt(interaction.options.getString('delete_messages')) || 0;

    const member = interaction.guild.members.cache.get(targetUser.id);
    
    if (!member) {
      return interaction.editReply('❌ User not found in this server!');
    }

    if (!member.bannable) {
      return interaction.editReply('❌ I don\'t have permission to ban this user!');
    }

    if (member.id === interaction.user.id) {
      return interaction.editReply('❌ You cannot ban yourself!');
    }

    if (member.id === client.user.id) {
      return interaction.editReply('❌ You cannot ban me!');
    }

    try {
      await member.ban({ 
        reason: `${reason} - Banned by ${interaction.user.tag}`,
        days: Math.floor(deleteMessages / 86400),
      });

      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('🔨 User Banned')
        .setDescription(`**${targetUser.tag}** has been banned`)
        .addFields(
          {
            name: 'Moderator',
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: 'Reason',
            value: reason,
            inline: true,
          },
          {
            name: 'Deleted Messages',
            value: deleteMessages > 0 ? `${deleteMessages} seconds worth` : 'None',
            inline: true,
          }
        )
        .setTimestamp();

      // Log to moderation channel
      const guildData = await Guild.findOne({ guildId: interaction.guildId });
      if (guildData?.moderation?.logs?.channelId) {
        const logChannel = interaction.guild.channels.cache.get(guildData.moderation.logs.channelId);
        if (logChannel) {
          await logChannel.send({ embeds: [embed] });
        }
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Ban command error:', error);
      await interaction.editReply('❌ An error occurred while banning the user.');
    }
  },
};
