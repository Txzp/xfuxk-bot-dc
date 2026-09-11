const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'close-ticket',
  description: 'Close the current ticket (optional reason)',
  data: { name: 'close-ticket', description: 'Close the current ticket (optional reason)', options: [ { name: 'reason', description: 'Closure reason', type: 3, required: false } ] },
  async executeInteraction(interaction) {
    try {
      const channel = interaction.channel;
      if (!channel || !channel.name.startsWith('ticket-')) return interaction.reply({ content: 'This command only works in ticket channels.', ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'You do not have permission to close the ticket.', ephemeral: true });
      const reason = interaction.options.getString('reason') || 'No reason provided';
      await interaction.reply({ content: 'Closing ticket...', ephemeral: true });
      await channel.send({ content: `Ticket closed by <@${interaction.user.id}>. Reason: ${reason}` }).catch(() => {});
      setTimeout(async () => {
        try {
          await channel.delete('Ticket closed');
        } catch (e) {
          console.error('Error borrando canal de ticket:', e);
        }
      }, 3000);
    } catch (err) {
      console.error('close-ticket error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error closing the ticket.', ephemeral: true });
    }
  }
};
