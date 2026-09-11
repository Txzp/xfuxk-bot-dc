const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'add-member',
  description: 'Añadir un miembro al ticket actual',
  data: { name: 'add-member', description: 'Añadir un miembro al ticket actual', options: [ { name: 'user', description: 'Usuario a añadir', type: 6, required: true } ] },
  async executeInteraction(interaction) {
    try {
      const channel = interaction.channel;
      if (!channel || !channel.name.startsWith('ticket-')) return interaction.reply({ content: 'Este comando solo funciona en canales de ticket.', ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'No tienes permisos para añadir miembros.', ephemeral: true });
      const member = interaction.options.getMember('user');
      if (!member) return interaction.reply({ content: 'Miembro no encontrado.', ephemeral: true });
      await channel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
      await interaction.reply({ content: `Se ha añadido a <@${member.id}> al ticket.`, ephemeral: true });
    } catch (err) {
      console.error('add-member error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error añadiendo miembro.', ephemeral: true });
    }
  }
};
