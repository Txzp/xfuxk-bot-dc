const { ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID || '1545635562403401799';
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || '1547807367758872586';

const TICKET_STARTER_MESSAGE = `**:ticket:  Need Help?**

*Open a ticket and a staff member will be with you shortly.*

**Please include:**
*— What's the issue?*
*— What have you already tried?*
*— Any screenshots?*

:warning: **Do NOT open multiple tickets for the same issue.**
**:warning: Be respectful. Abusive tickets will be closed.**`;

function buildTicketStarterComponents() {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_reason_select')
    .setPlaceholder('Choose an option')
    .addOptions([
      { label: '❓ Question', value: 'Question' },
      { label: '🎫 Support', value: 'Support' }
    ]);
  // Initially only show the select menu. After a user selects, a Next button will be added.
  return [new ActionRowBuilder().addComponents(selectMenu)];
}

module.exports = {
  name: 'ticket',
  description: 'Crea un mensaje de ticket con dropdown y botón',
  data: { name: 'ticket', description: 'Crea un mensaje de ticket con dropdown y botón' },
  async execute(message) {
    const guild = message.guild;
    if (!guild) return message.reply('Este comando solo funciona en servidores.');
    const targetChannel = await guild.channels.fetch(TICKET_CHANNEL_ID).catch(() => null);
    if (!targetChannel) return message.reply('No se encontró el canal de tickets configurado.');

    await targetChannel.send({ content: TICKET_STARTER_MESSAGE, components: buildTicketStarterComponents() });
    await message.reply({ content: `Mensaje de ticket creado en <#${TICKET_CHANNEL_ID}>`, ephemeral: true });
  },
  async executeInteraction(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: 'No tienes permisos para crear el mensaje de ticket.', ephemeral: true });
      }

      const guild = interaction.guild;
      if (!guild) return interaction.reply({ content: 'Este comando solo funciona en servidores.', ephemeral: true });
      const targetChannel = await guild.channels.fetch(TICKET_CHANNEL_ID).catch(() => null);
      if (!targetChannel) return interaction.reply({ content: 'No se encontró el canal de tickets configurado.', ephemeral: true });

      await targetChannel.send({ content: TICKET_STARTER_MESSAGE, components: buildTicketStarterComponents() });
      await interaction.reply({ content: `Mensaje de ticket creado en <#${TICKET_CHANNEL_ID}>`, ephemeral: true });
    } catch (err) {
      console.error('Ticket interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error creando el mensaje de ticket.', ephemeral: true });
    }
  }
};
