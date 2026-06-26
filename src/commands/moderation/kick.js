import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';
import Guild from '../../database/models/Guild.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)
    ),

  permissions: ['KickMembers'],
  botPermissions: ['KickMembers'],

  async execute(interaction, client) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = interaction.guild.members.cache.get(targetUser.id);
    
    if (!member) {
      return interaction.editReply('❌ User not found in this server!');
    }

    if (!member.kickable) {
      return interaction.editReply('❌ I don\'t have permission to kick this user!');
    }

    if (member.id === interaction.user.id) {
      return interaction.editReply('❌ You cannot kick yourself!');
    }

    if (member.id === client.user.id) {
      return interaction.editReply('❌ You cannot kick me!');
    }

    try {
      await member.kick(`${reason} - Kicked by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('👢 User Kicked')
        .setDescription(`**${targetUser.tag}** has been kicked`)
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
      logger.error('Kick command error:', error);
      await interaction.editReply('❌ An error occurred while kicking the user.');
    }
  },
};
