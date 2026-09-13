module.exports = (client) => {
  client.on('guildMemberRemove', async (member) => {
    try {
      const channelId = process.env.WELCOME_CHANNEL_ID || '';
      const channel = member.guild.channels.cache.get(channelId);
      if (channel) {
        await channel.send(`<@${member.id}> *left the server* **xFuxk Community**`);
      }
    } catch (err) {
      console.error('Error en guildMemberRemove', err);
    }
  });
};