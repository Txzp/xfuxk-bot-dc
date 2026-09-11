module.exports = (client) => {
  client.on('guildMemberRemove', async (member) => {
    try {
      const channelId = process.env.WELCOME_CHANNEL_ID || '1545627255877804081';
      const channel = member.guild.channels.cache.get(channelId);
      if (channel) {
        await channel.send(`${member.user.tag} has left the server. We hope to see you again!`);
      }
    } catch (err) {
      console.error('Error en guildMemberRemove', err);
    }
  });
};