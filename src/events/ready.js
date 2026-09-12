const { ensureLevelRoles } = require('../level-system');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const LEVELBOARD_CHANNEL_ID = '1548056682020610170';
const LEVELBOARD_INFO = `**🛡️ Level Leaderboard**

The top grinders of xFuxk Guidelines.

How do you earn XP?
*• Send messages in chat*
*• Stay active*

**Check the top 10 rankings with /leaderboard!**`;

module.exports = (client) => {
  client.once('clientReady', () => {
    console.log(`${client.user.tag} is online.`);
    for (const guild of client.guilds.cache.values()) {
      ensureLevelRoles(guild).then(roles => {
        console.log(`Level system ready in ${guild.name}: ${roles.length} level roles available.`);
      }).catch(error => console.error('Could not create level roles:', error));
      client.channels.fetch(LEVELBOARD_CHANNEL_ID).then(async channel => {
        if (!channel) return;
        const recentMessages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
        const leaderboardMessages = recentMessages?.filter(message => message.author.id === client.user.id && message.content.includes('Level Leaderboard')) || [];
        const currentMessage = leaderboardMessages.find(message => message.content === LEVELBOARD_INFO && message.components.some(row => row.components.some(component => component.customId === 'level_view_top')));
        const oldBotMessages = leaderboardMessages.filter(message => message.id !== currentMessage?.id);
        await Promise.all(oldBotMessages.map(message => message.delete().catch(() => {})));
        if (currentMessage) return;
        const viewTopButton = new ButtonBuilder()
          .setCustomId('level_view_top')
          .setLabel('View Top')
          .setStyle(ButtonStyle.Primary);
        await channel.send({
          content: LEVELBOARD_INFO,
          components: [new ActionRowBuilder().addComponents(viewTopButton)]
        }).catch(() => {});
      }).catch(error => console.error('Could not publish the leaderboard info:', error));
    }
  });
};
