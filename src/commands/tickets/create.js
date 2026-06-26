import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import { logger } from '../../utils/logger.js';
import Guild from '../../database/models/Guild.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a new ticket')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new ticket')
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Ticket category')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option.setName('subject')
            .setDescription('Ticket subject')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Detailed description')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('close')
        .setDescription('Close the current ticket')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('claim')
        .setDescription('Claim the current ticket')
    ),

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      await this.createTicket(interaction, client);
    } else if (subcommand === 'close') {
      await this.closeTicket(interaction, client);
    } else if (subcommand === 'claim') {
      await this.claimTicket(interaction, client);
    }
  },

  async createTicket(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const category = interaction.options.getString('category');
    const subject = interaction.options.getString('subject');
    const description = interaction.options.getString('description');

    const guildData = await Guild.findOne({ guildId: interaction.guildId });
    if (!guildData?.tickets?.enabled) {
      return interaction.editReply('❌ Tickets are not enabled in this server.');
    }

    // Check max tickets
    const existingTickets = interaction.guild.channels.cache.filter(
      c => c.type === ChannelType.GuildText && 
      c.name.startsWith('ticket-') &&
      c.topic?.includes(`Owner: ${interaction.user.id}`)
    );

    if (existingTickets.size >= (guildData.tickets.maxTicketsPerUser || 5)) {
      return interaction.editReply(`❌ You have reached the maximum number of tickets (${guildData.tickets.maxTicketsPerUser}).`);
    }

    try {
      // Get category channel
      const categoryChannel = guildData.tickets.categories?.find(c => c.name === category);
      
      // Create ticket channel
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
        type: ChannelType.GuildText,
        parent: guildData.tickets.categoryId,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
            ],
          },
          ...(categoryChannel?.roleId ? [{
            id: categoryChannel.roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          }] : []),
        ],
        topic: `Owner: ${interaction.user.id} | Category: ${category} | Created: ${new Date().toISOString()}`,
      });

      // Create ticket embed
      const embed = new EmbedBuilder()
        .setColor(0x00FFFF)
        .setTitle(`🎫 Ticket - ${subject}`)
        .setDescription(description)
        .addFields(
          {
            name: 'Created By',
            value: interaction.user.tag,
            inline: true,
          },
          {
            name: 'Category',
            value: category || 'General',
            inline: true,
          },
          {
            name: 'Status',
            value: '🟢 Open',
            inline: true,
          }
        )
        .setTimestamp();

      // Create action buttons
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_close_${ticketChannel.id}`)
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒'),
          new ButtonBuilder()
            .setCustomId(`ticket_claim_${ticketChannel.id}`)
            .setLabel('Claim Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👤'),
          new ButtonBuilder()
            .setCustomId(`ticket_transcript_${ticketChannel.id}`)
            .setLabel('Transcript')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📄')
        );

      await ticketChannel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embed],
        components: [row],
      });

      // Send confirmation
      await interaction.editReply({
        content: `✅ Ticket created: ${ticketChannel.toString()}`,
      });

      // Log ticket creation
      if (guildData.tickets.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(guildData.tickets.logChannelId);
        if (logChannel) {
          await logChannel.send({
            embeds: [{
              color: 0x00FFFF,
              title: '🎫 Ticket Created',
              description: `**User:** ${interaction.user.tag}\n**Channel:** ${ticketChannel.toString()}\n**Category:** ${category}\n**Subject:** ${subject}`,
              timestamp: new Date().toISOString(),
            }]
          });
        }
      }

    } catch (error) {
      logger.error('Ticket create error:', error);
      await interaction.editReply('❌ An error occurred while creating the ticket.');
    }
  },

  async closeTicket(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
      return interaction.editReply('❌ This is not a ticket channel.');
    }

    try {
      // Get transcript
      const messages = await channel.messages.fetch({ limit: 100 });
      const transcript = messages.reverse()
        .map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`)
        .join('\n');

      // Save transcript
      const guildData = await Guild.findOne({ guildId: interaction.guildId });
      if (guildData?.tickets?.transcriptChannelId) {
        const transcriptChannel = interaction.guild.channels.cache.get(guildData.tickets.transcriptChannelId);
        if (transcriptChannel) {
          const transcriptEmbed = new EmbedBuilder()
            .setColor(0x00FFFF)
            .setTitle(`📄 Ticket Transcript - ${channel.name}`)
            .setDescription(`Closed by: ${interaction.user.tag}`)
            .addFields(
              {
                name: 'Total Messages',
                value: `${messages.size}`,
                inline: true,
              },
              {
                name: 'Created At',
                value: channel.topic?.match(/Created: (.+)/)?.[1] || 'Unknown',
                inline: true,
              }
            )
            .setTimestamp();

          await transcriptChannel.send({
            embeds: [transcriptEmbed],
            files: [{
              attachment: Buffer.from(transcript, 'utf-8'),
              name: `transcript-${channel.name}.txt`,
            }],
          });
        }
      }

      // Update channel permissions
      const ticketOwnerId = channel.topic?.match(/Owner: (\d+)/)?.[1];
      if (ticketOwnerId) {
        await channel.permissionOverwrites.delete(ticketOwnerId);
      }

      await channel.send({
        embeds: [{
          color: 0xED4245,
          title: '🔒 Ticket Closed',
          description: `This ticket has been closed by ${interaction.user.tag}`,
          timestamp: new Date().toISOString(),
        }]
      });

      await channel.edit({
        name: `closed-${channel.name}`,
      });

      await interaction.editReply({
        content: '✅ Ticket has been closed.',
      });

    } catch (error) {
      logger.error('Ticket close error:', error);
      await interaction.editReply('❌ An error occurred while closing the ticket.');
    }
  },

  async claimTicket(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    if (!channel.name.startsWith('ticket-')) {
      return interaction.editReply('❌ This is not a ticket channel.');
    }

    try {
      const embed = new EmbedBuilder()
        .setColor(0x00FFFF)
        .setDescription(`👤 This ticket has been claimed by ${interaction.user.tag}`)
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      await interaction.editReply({
        content: '✅ Ticket claimed successfully.',
      });

    } catch (error) {
      logger.error('Ticket claim error:', error);
      await interaction.editReply('❌ An error occurred while claiming the ticket.');
    }
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);
    
    if (focused.name === 'category') {
      const guildData = await Guild.findOne({ guildId: interaction.guildId });
      const categories = guildData?.tickets?.categories || [];
      
      const filtered = categories
        .filter(c => c.name.toLowerCase().includes(focused.value.toLowerCase()))
        .slice(0, 25);
      
      await interaction.respond(
        filtered.map(c => ({ name: c.name, value: c.name }))
      );
    }
  },
};
