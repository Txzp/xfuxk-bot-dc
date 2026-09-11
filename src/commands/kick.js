const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'kick',
  description: 'Kick a member',
  options: [
    { name: 'target', description: 'User to kick', type: 6, required: true },
    { name: 'reason', description: 'Reason', type: 3, required: false }
  ],
  async execute(message, args) {
    if (!message.member.permissions.has('KICK_MEMBERS')) return message.reply('You do not have permission to kick members.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('Mention someone to kick.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!member.kickable) return message.reply('I cannot kick that member.');
    await member.kick(reason);
    message.channel.send(`${member.user.tag} was kicked. Reason: ${reason}`);
  },
  data: { name: 'kick', description: 'Kick a member', default_member_permissions: '16', options: [ { name: 'target', description: 'User to kick', type: 6, required: true }, { name: 'reason', description: 'Reason', type: 3, required: false } ] },
  async executeInteraction(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: 'You do not have permission to kick members.', ephemeral: true });
      const target = interaction.options.getMember('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!target) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      if (!target.kickable) return interaction.reply({ content: 'I cannot kick that member due to role hierarchy or permissions.', ephemeral: true });
      await target.kick(reason);
      await interaction.reply({ content: `${target.user.tag} was kicked. Reason: ${reason}` });
    } catch (err) {
      console.error('Kick interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error kicking the member.', ephemeral: true });
    }
  }
};
