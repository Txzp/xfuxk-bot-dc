const { ensureLevelRoles } = require('../level-system');

const LEVELBOARD_CHANNEL_ID = '1548056682020610170';
const LEVELBOARD_INFO = `**:17472bluecrown: Level Leaderboard**

The top grinders of xFuxk Guidelines.

How do you earn XP?
*• Send messages in chat*
*• Stay active*

**Check the top 5 rankings with /leaderboard!**`;

module.exports = (client) => {
  client.once('ready', () => {
    console.log(`${client.user.tag} is online.`);
    for (const guild of client.guilds.cache.values()) {
      ensureLevelRoles(guild).catch(error => console.error('Could not create level roles:', error));
      guild.channels.fetch(LEVELBOARD_CHANNEL_ID).then(async channel => {
        if (!channel) return;
        const recentMessages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
        const alreadyPosted = recentMessages?.some(message => message.author.id === client.user.id && message.content === LEVELBOARD_INFO);
        if (!alreadyPosted) await channel.send(LEVELBOARD_INFO).catch(() => {});
      }).catch(error => console.error('Could not publish the leaderboard info:', error));
    }
  });
};
