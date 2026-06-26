import { Kazagumo } from 'kazagumo';
import { KazagumoPlayer } from 'kazagumo';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

export const initializeMusicSystem = async (client) => {
  try {
    const nodes = config.lavalink.nodes.map(node => ({
      ...node,
      retryDelay: 5000,
      retryAmount: 5,
    }));

    const kazagumo = new Kazagumo({
      defaultSearchEngine: 'youtube',
      plugins: [],
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          guild.shard.send(payload);
        }
      },
    }, nodes);

    // Add event listeners
    kazagumo.on('playerStart', (player, track) => {
      logger.info(`[Music] Started playing ${track.title} in ${player.guildId}`);
      
      const guild = client.guilds.cache.get(player.guildId);
      if (guild) {
        const channel = guild.channels.cache.get(player.textId);
        if (channel) {
          channel.send({
            content: `🎵 Now playing: **${track.title}**`,
            embeds: [{
              color: 0x1DB954,
              title: 'Now Playing',
              description: `[${track.title}](${track.url})`,
              thumbnail: {
                url: track.thumbnail || null,
              },
              fields: [
                {
                  name: 'Duration',
                  value: formatDuration(track.duration),
                  inline: true,
                },
                {
                  name: 'Requested by',
                  value: `<@${track.requester || 'Unknown'}>`,
                  inline: true,
                },
              ],
              timestamp: new Date().toISOString(),
            }],
          });
        }
      }
    });

    kazagumo.on('playerEmpty', (player) => {
      logger.info(`[Music] Queue empty in ${player.guildId}`);
    });

    kazagumo.on('playerError', (player, error) => {
      logger.error(`[Music] Error in player ${player.guildId}:`, error);
    });

    kazagumo.on('nodeConnect', (node) => {
      logger.info(`[Music] Lavalink node connected: ${node.options.name}`);
    });

    kazagumo.on('nodeError', (node, error) => {
      logger.error(`[Music] Lavalink node error ${node.options.name}:`, error);
    });

    client.kazagumo = kazagumo;
    return kazagumo;

  } catch (error) {
    logger.error('[Music] Failed to initialize music system:', error);
    throw error;
  }
};

function formatDuration(ms) {
  if (!ms || ms < 0) return '0:00';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default {
  initializeMusicSystem,
};
