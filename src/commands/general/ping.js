import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency and response time')
    .addBooleanOption(option =>
      option.setName('detailed')
        .setDescription('Show detailed latency information')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const detailed = interaction.options.getBoolean('detailed') || false;
      const startTime = Date.now();

      // Send initial response
      const message = await interaction.editReply({
        content: '⏳ Pinging...',
      });

      const endTime = Date.now();
      const roundtripLatency = endTime - startTime;

      // Get WebSocket heartbeat ping
      const websocketPing = client.ws.ping;

      // Database latency
      const dbStart = Date.now();
      await client.db?.db?.admin().ping();
      const dbLatency = Date.now() - dbStart;

      let response = `🏓 **Pong!**\n`;
      response += `📶 **WebSocket:** ${websocketPing}ms\n`;
      response += `🔄 **Roundtrip:** ${roundtripLatency}ms\n`;
      
      if (detailed) {
        response += `💾 **Database:** ${dbLatency}ms\n`;
        response += `⏰ **Uptime:** ${formatUptime(process.uptime())}\n`;
        response += `📊 **Guilds:** ${client.guilds.cache.size}\n`;
        response += `👥 **Users:** ${client.users.cache.size}\n`;
        response += `🤖 **Commands:** ${client.commands.size}\n`;
        response += `💻 **Memory:** ${formatMemory(process.memoryUsage().heapUsed)}\n`;
      }

      await interaction.editReply({
        content: response,
        embeds: detailed ? [{
          color: 0x5865F2,
          title: '📊 Detailed Server Status',
          fields: [
            {
              name: '📈 Performance',
              value: `WebSocket: ${websocketPing}ms\nRoundtrip: ${roundtripLatency}ms\nDatabase: ${dbLatency}ms`,
              inline: true,
            },
            {
              name: '📊 Statistics',
              value: `Guilds: ${client.guilds.cache.size}\nUsers: ${client.users.cache.size}\nCommands: ${client.commands.size}`,
              inline: true,
            },
            {
              name: '💻 System',
              value: `Uptime: ${formatUptime(process.uptime())}\nMemory: ${formatMemory(process.memoryUsage().heapUsed)}\nNode: ${process.version}`,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        }] : [],
      });

      // Log command usage
      logger.info(`Ping command used by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);

    } catch (error) {
      logger.error('Ping command error:', error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while pinging.',
        });
      } else {
        await interaction.reply({
          content: '❌ An error occurred while pinging.',
          ephemeral: true,
        });
      }
    }
  },
};

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

function formatMemory(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
  return `${(bytes / 1073741824).toFixed(1)}GB`;
}
