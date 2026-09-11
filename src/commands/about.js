module.exports = {
  name: 'about',
  description: 'Información de un usuario',
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild ? message.guild.members.cache.get(user.id) : null;
    const joined = member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:R>` : 'N/A';
    message.channel.send({ content: `Usuario: ${user.tag}\nID: ${user.id}\nSe unió: ${joined}` });
  }
  ,
  data: { name: 'about', description: 'Información de un usuario', options: [ { name: 'target', description: 'Usuario a informar', type: 6, required: false } ] },
  async executeInteraction(interaction) {
    try {
      const user = interaction.options.getUser('target') || interaction.user;
      const member = interaction.guild ? interaction.guild.members.cache.get(user.id) : null;
      const joined = member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:R>` : 'N/A';
      await interaction.reply({ content: `Usuario: ${user.tag}\nID: ${user.id}\nSe unió: ${joined}` });
    } catch (err) {
      console.error('About interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'Error obteniendo información del usuario.', ephemeral: true });
    }
  }
};
