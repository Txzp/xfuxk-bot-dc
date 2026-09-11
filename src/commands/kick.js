const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'kick',
  description: 'Expulsar a un miembro',
  options: [
    { name: 'target', description: 'Usuario a expulsar', type: 6, required: true },
    { name: 'reason', description: 'Razón', type: 3, required: false }
  ],
  async execute(message, args) {
    if (!message.member.permissions.has('KICK_MEMBERS')) return message.reply('No tienes permisos para expulsar.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('Menciona a alguien para expulsar.');
    const reason = args.slice(1).join(' ') || 'Sin razón proporcionada';
    if (!member.kickable) return message.reply('No puedo expulsar a ese miembro.');
    await member.kick(reason);
    message.channel.send(`${member.user.tag} expulsado. Razón: ${reason}`);
  },
  data: { name: 'kick', description: 'Expulsar a un miembro', options: [ { name: 'target', description: 'Usuario a expulsar', type: 6, required: true }, { name: 'reason', description: 'Razón', type: 3, required: false } ] },
  async executeInteraction(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) return interaction.reply({ content: 'No tienes permisos para expulsar.', ephemeral: true });
      const target = interaction.options.getMember('target');
      const reason = interaction.options.getString('reason') || 'Sin razón proporcionada';
      if (!target) return interaction.reply({ content: 'Usuario no encontrado en este servidor.', ephemeral: true });
      if (!target.kickable) return interaction.reply({ content: 'No puedo expulsar a ese miembro (jerarquía/permisos).', ephemeral: true });
      await target.kick(reason);
      await interaction.reply({ content: `${target.user.tag} expulsado. Razón: ${reason}` });
    } catch (err) {
      console.error('Kick interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error ejecutando kick.', ephemeral: true });
    }
  }
};
