const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'ban',
  description: 'Banear a un miembro',
  options: [
    { name: 'target', description: 'Usuario a banear', type: 6, required: true },
    { name: 'reason', description: 'Razón', type: 3, required: false }
  ],
  async execute(message, args) {
    if (!message.member.permissions.has('BAN_MEMBERS')) return message.reply('No tienes permisos para banear.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('Menciona a alguien para banear.');
    const reason = args.slice(1).join(' ') || 'Sin razón proporcionada';
    if (!member.bannable) return message.reply('No puedo banear a ese miembro.');
    await member.ban({ reason });
    message.channel.send(`${member.user.tag} baneado. Razón: ${reason}`);
  },
  data: { name: 'ban', description: 'Banear a un miembro', options: [ { name: 'target', description: 'Usuario a banear', type: 6, required: true }, { name: 'reason', description: 'Razón', type: 3, required: false } ] },
  async executeInteraction(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: 'No tienes permisos para banear.', ephemeral: true });
      const target = interaction.options.getMember('target');
      const reason = interaction.options.getString('reason') || 'Sin razón proporcionada';
      if (!target) return interaction.reply({ content: 'Usuario no encontrado en este servidor.', ephemeral: true });
      if (!target.bannable) return interaction.reply({ content: 'No puedo banear a ese miembro (jerarquía/permisos).', ephemeral: true });
      await target.ban({ reason });
      await interaction.reply({ content: `${target.user.tag} baneado. Razón: ${reason}` });
    } catch (err) {
      console.error('Ban interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error ejecutando ban.', ephemeral: true });
    }
  }
};
