const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getLeaderboard } = require('../level-system');

const LEADERBOARD_CHANNEL_ID = '1548056682020610170';

function buildLeaderboardContent(guild, entries) {
  const lines = entries.map((entry, index) => {
    const member = guild.members.cache.get(entry.userId);
    const userName = member?.displayName || member?.user.username || 'Unknown User';
    return `${index + 1}. ${userName} — **Level ${entry.level}** (\`${entry.xp} XP\`)`;
  });

  return `**🛡️ Top 10 — xFuxk Guidelines**\n\n${lines.length ? lines.join('\n') : 'No XP has been earned yet.'}`;
}

module.exports = {
  name: 'leaderboard',
  description: 'Show the top 10 level rankings',
  data: {
    name: 'leaderboard',
    description: 'Show the top 10 level rankings'
  },
  async executeInteraction(interaction) {
    if (interaction.channelId !== LEADERBOARD_CHANNEL_ID) {
      return interaction.reply({ content: `Use this command in <#${LEADERBOARD_CHANNEL_ID}>.`, ephemeral: true });
    }

    const entries = getLeaderboard(interaction.guild.id, 10);
    const viewTopButton = new ButtonBuilder()
      .setCustomId('level_view_top')
      .setLabel('View Top')
      .setStyle(ButtonStyle.Primary);
    return interaction.reply({
      content: buildLeaderboardContent(interaction.guild, entries),
      components: [new ActionRowBuilder().addComponents(viewTopButton)],
      ephemeral: true
    });
  }
};

module.exports.buildLeaderboardContent = buildLeaderboardContent;
