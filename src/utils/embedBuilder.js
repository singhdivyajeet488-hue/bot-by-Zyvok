import { EmbedBuilder, Colors } from 'discord.js';
import config from '../config/index.js';

export class EmbedBuilderUtils {
  static defaultEmbed(title, description = null, color = Colors.Blurple) {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTimestamp()
      .setFooter({
        text: config.bot.name || 'Discord Bot',
        iconURL: config.bot.iconURL || undefined,
      });

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);

    return embed;
  }

  static success(message, title = 'Success') {
    return this.defaultEmbed(title, message, Colors.Green);
  }

  static error(message, title = 'Error') {
    return this.defaultEmbed(title, message, Colors.Red);
  }

  static warning(message, title = 'Warning') {
    return this.defaultEmbed(title, message, Colors.Yellow);
  }

  static info(message, title = 'Information') {
    return this.defaultEmbed(title, message, Colors.Blurple);
  }

  static loading(title = 'Processing...') {
    return this.defaultEmbed(title, null, Colors.Grey)
      .setDescription('⏳ Please wait...');
  }

  static music(title, description = null) {
    return this.defaultEmbed(title, description, Colors.Green)
      .setThumbnail('https://cdn.discordapp.com/attachments/123456789/thumbnail.png');
  }

  static level(title, description = null, level = null) {
    const embed = this.defaultEmbed(title, description, Colors.Gold);
    if (level) {
      embed.addFields({
        name: 'Level',
        value: level.toString(),
        inline: true,
      });
    }
    return embed;
  }

  static moderation(title, description = null, action = null) {
    const embed = this.defaultEmbed(title, description, Colors.Red);
    if (action) {
      embed.addFields({
        name: 'Action',
        value: action,
        inline: true,
      });
    }
    return embed;
  }

  static async paginate(items, page, itemsPerPage = 10) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = items.slice(start, end);
    const totalPages = Math.ceil(items.length / itemsPerPage);

    return {
      items: pageItems,
      page,
      totalPages,
      start,
      end: Math.min(end, items.length),
      total: items.length,
    };
  }

  static createProgressBar(current, total, size = 20, filledChar = '🔴', emptyChar = '⚪') {
    const ratio = Math.min(current / total, 1);
    const filled = Math.floor(ratio * size);
    const empty = size - filled;
    return filledChar.repeat(filled) + emptyChar.repeat(empty);
  }

  static formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  static truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }

  static createMusicEmbed(track, currentTime = 0, volume = 100) {
    const progress = this.createProgressBar(currentTime, track.duration || 1);
    const embed = this.music('Now Playing')
      .setThumbnail(track.thumbnail || config.bot.defaultThumbnail)
      .addFields(
        {
          name: '🎵 Title',
          value: `[${this.truncateText(track.title, 50)}](${track.url || '#'})`,
          inline: false,
        },
        {
          name: '👤 Requested by',
          value: track.requester ? `<@${track.requester}>` : 'Unknown',
          inline: true,
        },
        {
          name: '⏱️ Duration',
          value: this.formatDuration(track.duration || 0),
          inline: true,
        },
        {
          name: '🔊 Volume',
          value: `${volume}%`,
          inline: true,
        }
      )
      .setDescription(`\`${progress}\` ${this.formatDuration(currentTime)} / ${this.formatDuration(track.duration || 0)}`);

    return embed;
  }
}

export default EmbedBuilderUtils;
