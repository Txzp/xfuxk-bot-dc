module.exports = {
  name: 'lock',
  description: 'Bloquea el canal actual para @everyone',
  async execute(message) {
    if (!message.member.permissions.has('MANAGE_CHANNELS')) return message.reply('No tienes permisos para gestionar canales.');
    const channel = message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    message.channel.send('Canal bloqueado.');
  }
  ,
  data: { name: 'lock', description: 'Bloquea el canal actual para @everyone' },
  async executeInteraction(interaction) {
    try {
      if (!interaction.member.permissions.has('MANAGE_CHANNELS')) return interaction.reply({ content: 'No tienes permisos para gestionar canales.', ephemeral: true });
      const channel = interaction.channel;
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ content: 'Canal bloqueado.', ephemeral: false });
    } catch (err) {
      console.error('Lock interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error bloqueando el canal.', ephemeral: true });
    }
  }
};
