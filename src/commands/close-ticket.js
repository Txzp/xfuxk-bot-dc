const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'close-ticket',
  description: 'Cerrar el ticket actual (opcional: razón)',
  data: { name: 'close-ticket', description: 'Cerrar el ticket actual (opcional: razón)', options: [ { name: 'reason', description: 'Razón del cierre', type: 3, required: false } ] },
  async executeInteraction(interaction) {
    try {
      const channel = interaction.channel;
      if (!channel || !channel.name.startsWith('ticket-')) return interaction.reply({ content: 'Este comando solo funciona en canales de ticket.', ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'No tienes permisos para cerrar el ticket.', ephemeral: true });
      const reason = interaction.options.getString('reason') || 'Sin razón proporcionada';
      await interaction.reply({ content: 'Cerrando ticket...', ephemeral: true });
      await channel.send({ content: `Ticket cerrado por <@${interaction.user.id}>. Razón: ${reason}` }).catch(() => {});
      setTimeout(async () => {
        try {
          await channel.delete('Ticket cerrado');
        } catch (e) {
          console.error('Error borrando canal de ticket:', e);
        }
      }, 3000);
    } catch (err) {
      console.error('close-ticket error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error cerrando ticket.', ephemeral: true });
    }
  }
};
