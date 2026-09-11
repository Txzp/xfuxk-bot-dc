const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'add-member',
  description: 'Add a member to the current ticket',
  data: { name: 'add-member', description: 'Add a member to the current ticket', default_member_permissions: '16', options: [ { name: 'user', description: 'User to add', type: 6, required: true } ] },
  async executeInteraction(interaction) {
    try {
      const channel = interaction.channel;
      if (!channel || !channel.name.startsWith('ticket-')) return interaction.reply({ content: 'This command only works in ticket channels.', ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: 'You do not have permission to add members.', ephemeral: true });
      const member = interaction.options.getMember('user');
      if (!member) return interaction.reply({ content: 'Member not found.', ephemeral: true });
      await channel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
      await interaction.reply({ content: `<@${member.id}> was added to the ticket.`, ephemeral: true });
    } catch (err) {
      console.error('add-member error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error adding the member.', ephemeral: true });
    }
  }
};
