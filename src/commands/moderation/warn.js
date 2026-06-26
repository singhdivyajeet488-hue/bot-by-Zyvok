import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';
import User from '../../database/models/User.js';
import Guild from '../../database/models/Guild.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)
    ),

  permissions: ['ModerateMembers'],

  async execute(interaction, client) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    if (targetUser.id === interaction.user.id) {
      return interaction.editReply('❌ You cannot warn yourself!');
    }

    try {
      let userData = await User.findOne({ userId: targetUser.id });
      if (!userData) {
        userData = new User({
          userId: targetUser.id,
          username: targetUser.username,
        });
      }

      await userData.addWarning(interaction.guildId, reason, interaction.user.id);

      const embed = new EmbedBuilder()
        .setColor(0xFEE75C)
        .setTitle('⚠️ User Warned')
        .setDescription(`**${targetUser.tag}** has been warned`)
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
            name: 'Total Warnings',
            value: `${userData.warnings.length}`,
            inline: true,
          }
        )
        .setTimestamp();

      // Check if user reached max warnings
      const guildData = await Guild.findOne({ guildId: interaction.guildId });
      if (guildData?.moderation?.warnings?.maxWarnings) {
        const maxWarnings = guildData.moderation.warnings.maxWarnings;
        const userWarnings = userData.getWarnings(interaction.guildId).length;
        
        if (userWarnings >= maxWarnings) {
          const action = guildData.moderation.warnings.action || 'warn';
          
          // Take action based on configuration
          const member = interaction.guild.members.cache.get(targetUser.id);
          if (member) {
            if (action === 'kick' && member.kickable) {
              await member.kick(`Reached maximum warnings (${maxWarnings})`);
            } else if (action === 'ban' && member.bannable) {
              await member.ban({ reason: `Reached maximum warnings (${maxWarnings})` });
            } else if (action === 'mute' && member.moderatable) {
              await member.timeout(3600000, `Reached maximum warnings (${maxWarnings})`);
            }
          }
        }
      }

      // Log to moderation channel
      if (guildData?.moderation?.logs?.channelId) {
        const logChannel = interaction.guild.channels.cache.get(guildData.moderation.logs.channelId);
        if (logChannel) {
          await logChannel.send({ embeds: [embed] });
        }
      }

      // DM the user
      try {
        await targetUser.send({
          embeds: [{
            color: 0xFEE75C,
            title: `⚠️ You have been warned in ${interaction.guild.name}`,
            description: `**Reason:** ${reason}`,
            footer: { text: `Total warnings: ${userData.warnings.length}` },
            timestamp: new Date().toISOString(),
          }]
        });
      } catch (e) {
        // User has DMs disabled
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Warn command error:', error);
      await interaction.editReply('❌ An error occurred while warning the user.');
    }
  },
};
