import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createCanvas, loadImage, registerFont } from 'canvas';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import User from '../../database/models/User.js';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your or another user\'s rank')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check')
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
      let userData = await User.findOne({ userId: targetUser.id });
      if (!userData) {
        userData = new User({
          userId: targetUser.id,
          username: targetUser.username,
        });
        await userData.save();
      }

      // Get rank
      const allUsers = await User.find({})
        .sort({ 'leveling.totalXp': -1 })
        .lean();
      
      const rank = allUsers.findIndex(u => u.userId === targetUser.id) + 1;
      
      // Get next level XP
      const currentLevel = userData.leveling.level;
      const currentXP = userData.leveling.xp;
      const xpNeeded = userData.getXPNeeded(currentLevel);
      const progress = (currentXP / xpNeeded) * 100;

      // Generate rank card
      const canvas = createCanvas(1000, 400);
      const ctx = canvas.getContext('2d');

      // Background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#2C2F33');
      gradient.addColorStop(1, '#23272A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border
      ctx.strokeStyle = '#5865F2';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // User avatar
      const avatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 256 });
      const avatar = await loadImage(avatarURL);
      
      const avatarX = 50;
      const avatarY = 50;
      const avatarSize = 150;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Username
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(targetUser.username, 230, 100);

      // Discriminator
      ctx.fillStyle = '#99AAB5';
      ctx.font = '24px Arial';
      ctx.fillText(`#${targetUser.discriminator}`, 230, 140);

      // Level
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(`Level ${currentLevel}`, 230, 190);

      // Rank
      ctx.fillStyle = '#FEE75C';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`#${rank}`, 950, 100);

      ctx.fillStyle = '#99AAB5';
      ctx.font = '20px Arial';
      ctx.fillText('Rank', 950, 130);

      // XP Bar
      const barX = 230;
      const barY = 230;
      const barWidth = 650;
      const barHeight = 30;

      // Background bar
      ctx.fillStyle = '#2C2F33';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Progress bar
      const progressBarWidth = (progress / 100) * barWidth;
      const barGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      barGradient.addColorStop(0, '#5865F2');
      barGradient.addColorStop(1, '#1DB954');
      ctx.fillStyle = barGradient;
      
      const rounded = 15;
      ctx.beginPath();
      ctx.moveTo(barX + rounded, barY);
      ctx.lineTo(barX + progressBarWidth - rounded, barY);
      ctx.quadraticCurveTo(barX + progressBarWidth, barY, barX + progressBarWidth, barY + rounded);
      ctx.lineTo(barX + progressBarWidth, barY + barHeight - rounded);
      ctx.quadraticCurveTo(barX + progressBarWidth, barY + barHeight, barX + progressBarWidth - rounded, barY + barHeight);
      ctx.lineTo(barX + rounded, barY + barHeight);
      ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - rounded);
      ctx.lineTo(barX, barY + rounded);
      ctx.quadraticCurveTo(barX, barY, barX + rounded, barY);
      ctx.closePath();
      ctx.fill();

      // XP Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(currentXP)} / ${xpNeeded} XP`, barX + barWidth/2, barY + 22);

      const attachment = canvas.toBuffer();

      await interaction.editReply({
        files: [{
          attachment,
          name: 'rank.png',
        }]
      });

    } catch (error) {
      logger.error('Rank command error:', error);
      await interaction.editReply('❌ An error occurred while generating rank card.');
    }
  },
};
