const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'remove-member',
  description: 'Quitar un miembro del ticket actual',
  data: { name: 'remove-member', description: 'Remove a member from the current ticket', options: [ { name: 'user', description: 'User to remove', type: 6, required: true } ] },
  async executeInteraction(interaction) {
    try {
      const channel = interaction.channel;
      if (!channel || !channel.name.startsWith('ticket-')) return interaction.reply({ content: 'This command only works in ticket channels.', ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'You do not have permission to remove members.', ephemeral: true });
      const member = interaction.options.getMember('user');
      if (!member) return interaction.reply({ content: 'Member not found.', ephemeral: true });
      await channel.permissionOverwrites.delete(member.id).catch(() => {});
      await interaction.reply({ content: `<@${member.id}> was removed from the ticket.`, ephemeral: true });
    } catch (err) {
      console.error('remove-member error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error removing the member.', ephemeral: true });
    }
  }
};
