import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song name, URL, or playlist link')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('next')
        .setDescription('Play this song next in queue')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const query = interaction.options.getString('query');
    const playNext = interaction.options.getBoolean('next') || false;

    // Check voice state
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.editReply('❌ You must be in a voice channel to play music!');
    }

    // Check bot permissions
    const permissions = voiceChannel.permissionsFor(client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.editReply('❌ I need permissions to join and speak in your voice channel!');
    }

    try {
      const player = client.kazagumo.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: voiceChannel.id,
        deaf: true,
      });

      // Search for tracks
      const result = await client.kazagumo.search(query, {
        requester: interaction.user.id,
      });

      if (!result || !result.tracks.length) {
        return interaction.editReply('❌ No results found for your query!');
      }

      let trackCount = 0;
      const embed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setTitle('🎵 Added to Queue');

      if (result.type === 'PLAYLIST') {
        const tracks = playNext ? 
          [...result.tracks, ...player.queue] : 
          [...player.queue, ...result.tracks];
        
        player.queue.clear();
        player.queue.push(...tracks);
        trackCount = result.tracks.length;

        embed.setDescription(`Added **${result.tracks.length}** tracks from playlist **${result.playlistName}**`);
        embed.addFields({
          name: 'Playlist',
          value: `[${result.playlistName}](${query})`,
          inline: true,
        });
      } else {
        const track = result.tracks[0];
        if (playNext) {
          player.queue.unshift(track);
        } else {
          player.queue.push(track);
        }
        trackCount = 1;

        embed.setDescription(`Added **[${track.title}](${track.url})** to the queue`);
        embed.addFields(
          {
            name: 'Duration',
            value: formatDuration(track.duration),
            inline: true,
          },
          {
            name: 'Requested by',
            value: `<@${track.requester}>`,
            inline: true,
          }
        );
        if (track.thumbnail) {
          embed.setThumbnail(track.thumbnail);
        }
      }

      embed.addFields({
        name: 'Position in Queue',
        value: `#${player.queue.length - trackCount + 1}`,
        inline: true,
      });

      if (!player.playing && !player.paused) {
        await player.play();
        embed.setFooter({ text: '▶️ Now playing...' });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Play command error:', error);
      await interaction.editReply('❌ An error occurred while playing the song.');
    }
  },
};

function formatDuration(ms) {
  if (!ms || ms < 0) return '0:00';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
