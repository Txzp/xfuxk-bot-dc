module.exports = {
  name: 'about',
  description: 'Show information about a user',
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild ? message.guild.members.cache.get(user.id) : null;
    const joined = member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:R>` : 'N/A';
    message.channel.send({ content: `User: ${user.tag}\nID: ${user.id}\nJoined: ${joined}` });
  }
  ,
  data: { name: 'about', description: 'Show information about a user', options: [ { name: 'target', description: 'User to inspect', type: 6, required: false } ] },
  async executeInteraction(interaction) {
    try {
      const user = interaction.options.getUser('target') || interaction.user;
      const member = interaction.guild ? interaction.guild.members.cache.get(user.id) : null;
      const joined = member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:R>` : 'N/A';
      await interaction.reply({ content: `User: ${user.tag}\nID: ${user.id}\nJoined: ${joined}`, ephemeral: true });
      setTimeout(() => interaction.deleteReply().catch(() => {}), 7500);
    } catch (err) {
      console.error('About interaction error', err);
      if (!interaction.replied) await interaction.reply({ content: 'There was an error getting user information.', ephemeral: true });
    }
  }
};
