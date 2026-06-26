import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Get a random meme from Reddit'),

  async execute(interaction, client) {
    await interaction.deferReply();

    try {
      const response = await axios.get('https://meme-api.com/gimme');
      const meme = response.data;

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(meme.title || 'Meme')
        .setURL(meme.postLink || '')
        .setImage(meme.url)
        .setFooter({
          text: `👍 ${meme.ups || 0} upvotes | r/${meme.subreddit || 'memes'}`,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Meme command error:', error);
      await interaction.editReply('❌ An error occurred while fetching a meme.');
    }
  },
};
