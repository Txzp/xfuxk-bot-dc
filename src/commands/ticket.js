const { ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');

const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID || '1545635562403401799';
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || '1547807367758872586';
const TICKET_COMMAND_OWNER_ID = '1457132860216709182';

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
  description: 'Create the ticket panel',
  data: { name: 'ticket', description: 'Create the ticket panel' },
  async execute(message) {
    if (message.author.id !== TICKET_COMMAND_OWNER_ID) return;
    const guild = message.guild;
    if (!guild) return message.reply('This command can only be used in a server.');
    const targetChannel = await guild.channels.fetch(TICKET_CHANNEL_ID).catch(() => null);
    if (!targetChannel) return message.reply('The configured ticket channel could not be found.');

    await targetChannel.send({ content: TICKET_STARTER_MESSAGE, components: buildTicketStarterComponents() });
  },
  async executeInteraction(interaction) {
    try {
      if (interaction.user.id !== TICKET_COMMAND_OWNER_ID) {
        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();
        return;
      }
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.editReply('You do not have permission to create the ticket panel.');
      }

      const guild = interaction.guild;
      if (!guild) return interaction.editReply('This command can only be used in a server.');
      const targetChannel = await guild.channels.fetch(TICKET_CHANNEL_ID).catch(() => null);
      if (!targetChannel) return interaction.editReply('The configured ticket channel could not be found.');

      await targetChannel.send({ content: TICKET_STARTER_MESSAGE, components: buildTicketStarterComponents() });
      await interaction.deleteReply();
    } catch (err) {
      console.error('Ticket interaction error', err);
      if (interaction.deferred && !interaction.replied) await interaction.editReply('There was an error creating the ticket panel.');
      else if (!interaction.replied) await interaction.reply({ content: 'There was an error creating the ticket panel.', ephemeral: true });
    }
  }
};
