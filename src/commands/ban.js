const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'ban',
  description: 'Ban a member',
  options: [
    { name: 'target', description: 'User to ban', type: 6, required: true },
    { name: 'reason', description: 'Reason', type: 3, required: false }
  ],
  async execute(message, args) {
    if (!message.member.permissions.has('BAN_MEMBERS')) return message.reply('You do not have permission to ban members.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('Mention someone to ban.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!member.bannable) return message.reply('I cannot ban that member.');
    await member.ban({ reason });
    message.channel.send(`${member.user.tag} was banned. Reason: ${reason}`);
  },
  data: { name: 'ban', description: 'Ban a member', options: [ { name: 'target', description: 'User to ban', type: 6, required: true }, { name: 'reason', description: 'Reason', type: 3, required: false } ] },
  async executeInteraction(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: 'You do not have permission to ban members.', ephemeral: true });
      const target = interaction.options.getMember('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!target) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      if (!target.bannable) return interaction.reply({ content: 'I cannot ban that member due to role hierarchy or permissions.', ephemeral: true });
      await target.ban({ reason });
      await interaction.reply({ content: `${target.user.tag} was banned. Reason: ${reason}` });
    } catch (err) {
      console.error('Ban interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error banning the member.', ephemeral: true });
    }
  }
};
