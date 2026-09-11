const { ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const ticketSelections = new Map();
const ticketOwners = new Map();
const ticketClaimers = new Map();
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || '1547807367758872586';
const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID || '1545635562403401799';
const STAFF_ROLE_IDS = [
  '1529556626300866671',
  '1529668878517407824',
  '1529670461305393262'
];
const LOGS_CHANNEL_ID = process.env.LOGS_CHANNEL_ID || '1533051943788875817';

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
        if (interaction.customId !== 'ticket_reason_select') return;
        ticketSelections.set(interaction.user.id, interaction.values[0]);
        const modal = new ModalBuilder().setCustomId(`ticket_recruit_modal:${interaction.user.id}`).setTitle('Open Ticket');
        const input = new TextInputBuilder()
          .setCustomId('open_details')
          .setLabel("Describe what's happening")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }

      if (interaction.isButton && interaction.isButton()) {
        const customId = interaction.customId;
        if (customId === 'ticket_open_button') {
          // Defer reply immediately to avoid "The application did not respond" while we create the channel
          await interaction.deferReply({ ephemeral: true }).catch(() => {});
          const reason = ticketSelections.get(interaction.user.id);
          if (!reason) {
            return interaction.editReply({ content: 'Please select a ticket type first.' });
          }

          const guild = interaction.guild;
          if (!guild) return interaction.editReply({ content: 'This command can only be used in a server.' });

          // Fetch the category in case it's not cached
          let category = null;
          try {
            category = await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null);
          } catch (e) {
            category = null;
          }
          if (!category) return interaction.editReply({ content: 'The configured ticket category could not be found.' });

          const nameBase = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'ticket';
          const ticketName = `ticket-${nameBase}-${Math.floor(1000 + Math.random() * 9000)}`;

          let ticketChannel;
          try {
            ticketChannel = await guild.channels.create({
              name: ticketName,
              type: ChannelType.GuildText,
              parent: category.id,
              topic: `Ticket from ${interaction.user.tag} | ${reason}`
            });
            await ticketChannel.permissionOverwrites.set([
              {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              },
              {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              },
              {
                id: interaction.client.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              },
              ...STAFF_ROLE_IDS.map(roleId => ({
                id: roleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              }))
            ]);
          } catch (err) {
            console.error('Error creating ticket channel:', err);
            return interaction.editReply({ content: 'There was an error creating the ticket channel. Check permissions and the category.' });
          }

          // register owner for this ticket channel
          try { ticketOwners.set(ticketChannel.id, interaction.user.id); } catch (e) { /* ignore */ }

          ticketSelections.delete(interaction.user.id);
          const claimButton = new ButtonBuilder().setCustomId('ticket_claim_button').setLabel('Claim Ticket').setStyle(ButtonStyle.Success);
          const closeButton = new ButtonBuilder().setCustomId('ticket_close_button').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);

          try {
            await ticketChannel.send({
              content: `**${reason}**\n**User:** <@${interaction.user.id}>`,
              components: [new ActionRowBuilder().addComponents(claimButton, closeButton)]
            });
          } catch (err) {
            console.error('Error sending the ticket message:', err);
            try {
              await interaction.editReply({ content: `Ticket created: <#${ticketChannel.id}>, but I could not send the initial message. Check permissions.` });
            } catch (e) {
              console.error('Could not edit the deferred response:', e);
            }
            return;
          }

          return interaction.editReply({ content: `Ticket created: <#${ticketChannel.id}>` });
        }

        if (customId === 'ticket_claim_button') {
          const channel = interaction.channel;
          if (!channel || !ticketOwners.has(channel.id)) return interaction.reply({ content: 'This button only works in ticket channels.', ephemeral: true });
          const isStaff = interaction.member.roles.cache.some(r => STAFF_ROLE_IDS.includes(r.id));
          if (!isStaff) return interaction.reply({ content: 'You do not have permission to claim tickets.', ephemeral: true });
          const ownerId = ticketOwners.get(channel.id);
          ticketClaimers.set(channel.id, interaction.user.id);
          if (ownerId) {
            await channel.send(`<@${ownerId}>, your ticket has been claimed by <@${interaction.user.id}>`);
          } else {
            await channel.send(`Ticket claimed by <@${interaction.user.id}>`);
          }
          await interaction.reply({ content: 'Ticket claimed.', ephemeral: true });
          return;
        }

        if (customId === 'ticket_close_button') {
          const channel = interaction.channel;
          if (!channel || !ticketOwners.has(channel.id)) return interaction.reply({ content: 'This button only works in ticket channels.', ephemeral: true });
          const isStaffClose = interaction.member.roles.cache.some(r => STAFF_ROLE_IDS.includes(r.id));
          if (!isStaffClose) return interaction.reply({ content: 'You do not have permission to close tickets.', ephemeral: true });
          const modal = new ModalBuilder()
            .setCustomId(`ticket_close_modal:${channel.id}`)
            .setTitle('Close Ticket');
          const input = new TextInputBuilder()
            .setCustomId('close_reason')
            .setLabel('Closure reason')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
          const row = new ActionRowBuilder().addComponents(input);
          modal.addComponents(row);
          await interaction.showModal(modal).catch(err => {
            console.error('Error showing close modal:', err);
            interaction.reply({ content: 'I could not open the close modal.', ephemeral: true }).catch(() => {});
          });
          return;
        }
        // Next button to open recruitment modal (only the user who selected)
        if (customId && customId.startsWith('ticket_next_button:')) {
          const parts = customId.split(':');
          const userId = parts[1];
          if (userId !== interaction.user.id) return interaction.reply({ content: 'Only the user who selected this option can continue.', ephemeral: true });
          // Show one input for the ticket explanation.
          const modal = new ModalBuilder().setCustomId(`ticket_recruit_modal:${interaction.user.id}`).setTitle('Open Ticket');
          const input = new TextInputBuilder()
            .setCustomId('open_details')
            .setLabel('Please explain what exactly is happening in english or spanish')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await interaction.showModal(modal).catch(err => {
            console.error('Error showing ticket modal:', err);
            interaction.reply({ content: 'I could not open the ticket modal.', ephemeral: true }).catch(() => {});
          });
          return;
        }
      }

      if (interaction.isModalSubmit && interaction.isModalSubmit()) {
        const custom = interaction.customId || '';
        if (custom.startsWith('ticket_close_modal:')) {
          const parts = custom.split(':');
          const channelId = parts[1];
          const reason = interaction.fields.getTextInputValue('close_reason');
          const channel = interaction.guild.channels.cache.get(channelId) || await interaction.guild.channels.fetch(channelId).catch(() => null);
          await interaction.reply({ content: 'Closing ticket...', ephemeral: true }).catch(() => {});
          if (channel) {
            await channel.send({ content: `Ticket closed by <@${interaction.user.id}>. Reason: ${reason}` }).catch(() => {});
            // send log embed to logs channel
            try {
              const logsChannel = await interaction.guild.channels.fetch(LOGS_CHANNEL_ID).catch(() => null);
              if (logsChannel) {
                // count messages (fetch up to 100)
                const fetched = await channel.messages.fetch({ limit: 100 }).catch(() => null);
                const msgCount = fetched ? fetched.size : 0;
                const logEmbed = new EmbedBuilder()
                  .setTitle('Ticket Closed')
                  .addFields(
                    { name: 'Ticket', value: `${channel.name}`, inline: true },
                    { name: 'Owner', value: `<@${ticketOwners.get(channel.id) || 'Desconocido'}>`, inline: true },
                    { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Messages (last 100)', value: `${msgCount}`, inline: true },
                    { name: 'Reason', value: reason }
                  )
                  .setTimestamp();
                await logsChannel.send({ embeds: [logEmbed] }).catch(() => {});
              }
            } catch (e) {
              console.error('Error sending ticket log:', e);
            }
            // wait 3 seconds then delete
            setTimeout(async () => {
              try {
                ticketOwners.delete(channel.id);
                ticketClaimers.delete(channel.id);
                await channel.delete('Ticket closed');
              } catch (e) {
                console.error('Error deleting ticket channel:', e);
              }
            }, 3000);
          }
          return;
        }

        if (custom.startsWith('ticket_recruit_modal:')) {
          const parts = custom.split(':');
          const userId = parts[1];
          // only allow original user to submit
          if (userId !== interaction.user.id) return interaction.reply({ content: 'You are not authorized.', ephemeral: true });
          const openDetails = interaction.fields.getTextInputValue('open_details');
          await interaction.reply({ content: 'Creando ticket...', ephemeral: true }).catch(() => {});
          const guild = interaction.guild;
          if (!guild) return interaction.followUp({ content: 'This command can only be used in a server.', ephemeral: true });

          // fetch category
          let category = null;
          try { category = await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null); } catch (e) { category = null; }
          if (!category) return interaction.followUp({ content: 'The configured ticket category could not be found.', ephemeral: true });

          const nameBase = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'ticket';
          const ticketName = `ticket-${nameBase}-${Math.floor(1000 + Math.random() * 9000)}`;

          // prepare permission overwrites: deny everyone, allow owner, allow staff roles, allow bot
          const overwrites = [
            { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
          ];
          for (const roleId of STAFF_ROLE_IDS) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

          let ticketChannel;
          try {
            ticketChannel = await guild.channels.create({
              name: ticketName,
              type: ChannelType.GuildText,
              parent: category.id,
              topic: `Ticket from ${interaction.user.tag} | ${openDetails}`
            });
            await ticketChannel.permissionOverwrites.set(overwrites);
          } catch (err) {
            console.error('Error creating ticket channel:', err);
            return interaction.followUp({ content: 'There was an error creating the ticket channel. Check permissions.', ephemeral: true });
          }

          // register owner
          try { ticketOwners.set(ticketChannel.id, interaction.user.id); } catch (e) { }
          const selectedOption = ticketSelections.get(interaction.user.id) || 'Unknown';
          ticketSelections.delete(interaction.user.id);

          // Send the ticket details as plain text with the action buttons.
          const ticketMessage = `**${selectedOption}**\n**User:** <@${interaction.user.id}>\n**Details:** ${openDetails}`;

          const claimButton = new ButtonBuilder().setCustomId('ticket_claim_button').setLabel('Claim Ticket').setStyle(ButtonStyle.Success);
          const closeButton = new ButtonBuilder().setCustomId('ticket_close_button').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);

          try {
            await ticketChannel.send({ content: ticketMessage, components: [new ActionRowBuilder().addComponents(claimButton, closeButton)] });
            await interaction.followUp({ content: `Ticket created: <#${ticketChannel.id}>`, ephemeral: true });
          } catch (err) {
            console.error('Error sending ticket message:', err);
            await interaction.followUp({ content: `Ticket created: <#${ticketChannel.id}>, but sending the message failed. Check permissions.`, ephemeral: true });
          }

          return;
        }
      }

      if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return interaction.reply({ content: 'Command not implemented.', ephemeral: true });

        try {
          if (typeof cmd.executeInteraction === 'function') {
            await cmd.executeInteraction(interaction, client);
          } else {
            await interaction.reply({ content: `Command '${interaction.commandName}' received.`, ephemeral: true });
          }
        } catch (err) {
            console.error('Error executing interaction command:', err);
            if (interaction.replied || interaction.deferred) await interaction.editReply('There was an error executing the command.');
            else await interaction.reply({ content: 'There was an error executing the command.', ephemeral: true });
        }
      }
    } catch (err) {
      console.error('Error in interactionCreate handler:', err);
    }
  });
};
