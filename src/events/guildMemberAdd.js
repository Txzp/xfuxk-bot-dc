module.exports = (client) => {
  client.on('guildMemberAdd', async (member) => {
    try {
      const roleId = process.env.MEMBER_ROLE_ID || '1545627254799736886';
      const roleName = process.env.MEMBER_ROLE_NAME || 'Member';
      const role = member.guild.roles.cache.get(roleId) || member.guild.roles.cache.find(r => r.name === roleName);
      if (role) {
        await member.roles.add(role).catch(err => console.error('Could not assign the Member role:', err));
      }

      const channelId = process.env.WELCOME_CHANNEL_ID || '1545627255877804081';
      const channel = member.guild.channels.cache.get(channelId) || member.guild.systemChannel;
      if (channel) {
        channel.send(`<@${member.id}> **👋 Welcome to xFuxk Guidelines!** Read the rules! <#1547808241411424337>`);
      }
    } catch (err) {
      console.error('Error in guildMemberAdd:', err);
    }
  });
};
