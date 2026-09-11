const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'remove-member',
  description: 'Quitar un miembro del ticket actual',
  data: { name: 'remove-member', description: 'Quitar un miembro del ticket actual', options: [ { name: 'user', description: 'Usuario a quitar', type: 6, required: true } ] },
  async executeInteraction(interaction) {
    try {
      const channel = interaction.channel;
      if (!channel || !channel.name.startsWith('ticket-')) return interaction.reply({ content: 'Este comando solo funciona en canales de ticket.', ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'No tienes permisos para quitar miembros.', ephemeral: true });
      const member = interaction.options.getMember('user');
      if (!member) return interaction.reply({ content: 'Miembro no encontrado.', ephemeral: true });
      await channel.permissionOverwrites.delete(member.id).catch(() => {});
      await interaction.reply({ content: `Se ha eliminado a <@${member.id}> del ticket.`, ephemeral: true });
    } catch (err) {
      console.error('remove-member error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error quitando miembro.', ephemeral: true });
    }
  }
};
