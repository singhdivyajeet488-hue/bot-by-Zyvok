import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

const responses = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes, definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  'Don\'t count on it.',
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.',
];

export default {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question')
        .setRequired(true)
        .setMaxLength(200)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const question = interaction.options.getString('question');
    const answer = responses[Math.floor(Math.random() * responses.length)];

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        {
          name: 'Question',
          value: question,
          inline: false,
        },
        {
          name: 'Answer',
          value: `**${answer}**`,
          inline: false,
        }
      )
      .setFooter({
        text: `Asked by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
