const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID || '1536241118000324658';
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || '1536241332526514259';

function buildTicketStarterEmbed() {
  return new EmbedBuilder()
    .setTitle('Ticket Support')
    .setDescription('[Abre ticket y elige que es lo que necesitas y se te responderá lo antes posible]')
    .setColor(0x00AE86);
}

function buildTicketStarterComponents() {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_reason_select')
    .setPlaceholder('Elige una opción')
    .addOptions([
      { label: 'Soporte', value: 'Soporte' },
      { label: 'Preguntas', value: 'Preguntas' },
      { label: 'Buy Credits', value: 'Buy Credits' }
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

    await targetChannel.send({ embeds: [buildTicketStarterEmbed()], components: buildTicketStarterComponents() });
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

      await targetChannel.send({ embeds: [buildTicketStarterEmbed()], components: buildTicketStarterComponents() });
      await interaction.reply({ content: `Mensaje de ticket creado en <#${TICKET_CHANNEL_ID}>`, ephemeral: true });
    } catch (err) {
      console.error('Ticket interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error creando el mensaje de ticket.', ephemeral: true });
    }
  }
};
