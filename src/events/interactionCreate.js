const { ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const ticketSelections = new Map();
const ticketOwners = new Map();
const ticketClaimers = new Map();
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || '1547807367758872586';
const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID || '1536241118000324658';
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
        // Reply ephemerally with a Next button only visible to the user who selected
        try {
          const nextBtn = new ButtonBuilder().setCustomId(`ticket_next_button:${interaction.user.id}`).setLabel('Next').setStyle(ButtonStyle.Primary);
          await interaction.reply({ content: `Seleccionaste: ${interaction.values[0]}`, components: [new ActionRowBuilder().addComponents(nextBtn)], ephemeral: true });
        } catch (e) {
          await interaction.reply({ content: `Seleccionaste: ${interaction.values[0]}`, ephemeral: true });
        }
        return;
      }

      if (interaction.isButton && interaction.isButton()) {
        const customId = interaction.customId;
        if (customId === 'ticket_open_button') {
          // Defer reply immediately to avoid "The application did not respond" while we create the channel
          await interaction.deferReply({ ephemeral: true }).catch(() => {});
          const reason = ticketSelections.get(interaction.user.id);
          if (!reason) {
            return interaction.editReply({ content: 'Primero selecciona una razón en el dropdown.' });
          }

          const guild = interaction.guild;
          if (!guild) return interaction.editReply({ content: 'Este comando solo funciona en servidores.' });

          // Fetch the category in case it's not cached
          let category = null;
          try {
            category = await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null);
          } catch (e) {
            category = null;
          }
          if (!category) return interaction.editReply({ content: 'No se encontró la categoría de tickets.' });

          const nameBase = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'ticket';
          const ticketName = `ticket-${nameBase}-${Math.floor(1000 + Math.random() * 9000)}`;

          let ticketChannel;
          try {
            ticketChannel = await guild.channels.create({
              name: ticketName,
              type: ChannelType.GuildText,
              parent: category.id,
              topic: `Ticket de ${interaction.user.tag} | Razón: ${reason}`
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
            console.error('Error creando canal de ticket:', err);
            return interaction.editReply({ content: 'Error creando el canal de ticket. Revisa permisos y la categoría.' });
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
            console.error('Error enviando mensaje en canal de ticket:', err);
            try {
              await interaction.editReply({ content: `Ticket creado: <#${ticketChannel.id}> — pero no pude enviar el mensaje inicial en ese canal. Revisa permisos.` });
            } catch (e) {
              console.error('No pude editar la respuesta diferida:', e);
            }
            return;
          }

          return interaction.editReply({ content: `Ticket creado: <#${ticketChannel.id}>` });
        }

        if (customId === 'ticket_claim_button') {
          const channel = interaction.channel;
          if (!channel || !ticketOwners.has(channel.id)) return interaction.reply({ content: 'Este botón solo funciona en canales de ticket.', ephemeral: true });
          const isStaff = interaction.member.roles.cache.some(r => STAFF_ROLE_IDS.includes(r.id));
          if (!isStaff) return interaction.reply({ content: 'No tienes permisos para reclamar tickets.', ephemeral: true });
          const ownerId = ticketOwners.get(channel.id);
          ticketClaimers.set(channel.id, interaction.user.id);
          if (ownerId) {
            await channel.send(`<@${ownerId}>, tu ticket ha sido reclamado por <@${interaction.user.id}>`);
          } else {
            await channel.send(`Ticket reclamado por <@${interaction.user.id}>`);
          }
          await interaction.reply({ content: 'Ticket reclamado.', ephemeral: true });
          return;
        }

        if (customId === 'ticket_close_button') {
          const channel = interaction.channel;
          if (!channel || !ticketOwners.has(channel.id)) return interaction.reply({ content: 'Este botón solo funciona en canales de ticket.', ephemeral: true });
          const isStaffClose = interaction.member.roles.cache.some(r => STAFF_ROLE_IDS.includes(r.id));
          if (!isStaffClose) return interaction.reply({ content: 'No tienes permisos para cerrar tickets.', ephemeral: true });
          const modal = new ModalBuilder()
            .setCustomId(`ticket_close_modal:${channel.id}`)
            .setTitle('Cerrar ticket');
          const input = new TextInputBuilder()
            .setCustomId('close_reason')
            .setLabel('Motivo del cierre')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
          const row = new ActionRowBuilder().addComponents(input);
          modal.addComponents(row);
          await interaction.showModal(modal).catch(err => {
            console.error('Error mostrando modal:', err);
            interaction.reply({ content: 'No pude abrir el modal de cierre.', ephemeral: true }).catch(() => {});
          });
          return;
        }
        // Next button to open recruitment modal (only the user who selected)
        if (customId && customId.startsWith('ticket_next_button:')) {
          const parts = customId.split(':');
          const userId = parts[1];
          if (userId !== interaction.user.id) return interaction.reply({ content: 'Solo quien seleccionó puede continuar.', ephemeral: true });
          // Show one input for the ticket explanation.
          const modal = new ModalBuilder().setCustomId(`ticket_recruit_modal:${interaction.user.id}`).setTitle('Open Ticket');
          const input = new TextInputBuilder()
            .setCustomId('open_details')
            .setLabel('Please explain what exactly is happening in english or spanish')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await interaction.showModal(modal).catch(err => {
            console.error('Error mostrando recruitment modal:', err);
            interaction.reply({ content: 'No pude abrir el modal de recruitment.', ephemeral: true }).catch(() => {});
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
          await interaction.reply({ content: 'Cerrando ticket...', ephemeral: true }).catch(() => {});
          if (channel) {
            await channel.send({ content: `Ticket cerrado por <@${interaction.user.id}>. Razón: ${reason}` }).catch(() => {});
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
              console.error('Error enviando log embed:', e);
            }
            // wait 3 seconds then delete
            setTimeout(async () => {
              try {
                ticketOwners.delete(channel.id);
                ticketClaimers.delete(channel.id);
                await channel.delete('Ticket cerrado');
              } catch (e) {
                console.error('Error borrando canal de ticket:', e);
              }
            }, 3000);
          }
          return;
        }

        if (custom.startsWith('ticket_recruit_modal:')) {
          const parts = custom.split(':');
          const userId = parts[1];
          // only allow original user to submit
          if (userId !== interaction.user.id) return interaction.reply({ content: 'No autorizado.', ephemeral: true });
          const openDetails = interaction.fields.getTextInputValue('open_details');
          await interaction.reply({ content: 'Creando ticket...', ephemeral: true }).catch(() => {});
          const guild = interaction.guild;
          if (!guild) return interaction.followUp({ content: 'Este comando solo funciona en servidores.', ephemeral: true });

          // fetch category
          let category = null;
          try { category = await guild.channels.fetch(TICKET_CATEGORY_ID).catch(() => null); } catch (e) { category = null; }
          if (!category) return interaction.followUp({ content: 'No se encontró la categoría de tickets.', ephemeral: true });

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
              topic: `Ticket de ${interaction.user.tag} | ${openDetails}`
            });
            await ticketChannel.permissionOverwrites.set(overwrites);
          } catch (err) {
            console.error('Error creando canal de ticket (recruit):', err);
            return interaction.followUp({ content: 'Error creando canal de ticket. Revisa permisos.', ephemeral: true });
          }

          // register owner
          try { ticketOwners.set(ticketChannel.id, interaction.user.id); } catch (e) { }
          const selectedOption = ticketSelections.get(interaction.user.id) || 'No especificado';
          ticketSelections.delete(interaction.user.id);

          // Send the ticket details as plain text with the action buttons.
          const ticketMessage = `**${selectedOption}**\n**User:** <@${interaction.user.id}>\n**Details:** ${openDetails}`;

          const claimButton = new ButtonBuilder().setCustomId('ticket_claim_button').setLabel('Claim Ticket').setStyle(ButtonStyle.Success);
          const closeButton = new ButtonBuilder().setCustomId('ticket_close_button').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);

          try {
            await ticketChannel.send({ content: ticketMessage, components: [new ActionRowBuilder().addComponents(claimButton, closeButton)] });
            await interaction.followUp({ content: `Ticket creado: <#${ticketChannel.id}>`, ephemeral: true });
          } catch (err) {
            console.error('Error enviando embed en canal de ticket (recruit):', err);
            await interaction.followUp({ content: `Ticket creado: <#${ticketChannel.id}> — falló enviar embed. Revisa permisos.`, ephemeral: true });
          }

          return;
        }
      }

      if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return interaction.reply({ content: 'Comando no implementado.', ephemeral: true });

        try {
          if (typeof cmd.executeInteraction === 'function') {
            await cmd.executeInteraction(interaction, client);
          } else {
            await interaction.reply({ content: `Comando '${interaction.commandName}' recibido.`, ephemeral: true });
          }
        } catch (err) {
          console.error('Error al ejecutar interaction command:', err);
          if (interaction.replied || interaction.deferred) await interaction.editReply('Error ejecutando el comando.');
          else await interaction.reply({ content: 'Error ejecutando el comando.', ephemeral: true });
        }
      }
    } catch (err) {
      console.error('Error en interactionCreate handler', err);
    }
  });
};
